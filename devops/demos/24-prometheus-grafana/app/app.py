import os
import random
import threading
import time

from flask import Flask, Response, jsonify, request
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

app = Flask(__name__)

REQUEST_COUNT = Counter(
    "demo_http_requests_total",
    "Total HTTP requests handled by the demo app",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "demo_request_latency_seconds",
    "Latency of demo endpoints in seconds",
    ["endpoint"],
    buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
)

IN_PROGRESS = Gauge(
    "demo_requests_in_progress",
    "In-flight requests right now",
    ["endpoint"],
)

ERRORS = Counter(
    "demo_errors_total",
    "Total simulated errors raised",
    ["endpoint"],
)

ORDERS = Counter("demo_orders_total", "Total orders created")
ORDERS_VALUE = Counter("demo_orders_value_sum", "Total order value in INR")
QUEUE = Gauge("demo_queue_size", "Simulated background queue depth")

UP = Gauge("demo_up", "App is alive")
UP.set(1)


def _work(min_s=0.01, max_s=0.35):
    t0 = time.perf_counter()
    time.sleep(random.uniform(min_s, max_s))
    return time.perf_counter() - t0


@app.route("/")
def index():
    return jsonify(
        {
            "service": "prometheus-grafana demo app",
            "endpoints": ["/api/orders", "/api/error", "/metrics", "/health"],
        }
    )


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/orders")
def orders():
    IN_PROGRESS.labels(endpoint="/api/orders").inc()
    try:
        elapsed = _work()
        REQUEST_LATENCY.labels(endpoint="/api/orders").observe(elapsed)
        amount = random.randint(100, 5000)
        ORDERS.inc()
        ORDERS_VALUE.inc(amount)
        REQUEST_COUNT.labels("GET", "/api/orders", "200").inc()
        return jsonify({"order_id": random.randint(1000, 9999), "amount_inr": amount})
    finally:
        IN_PROGRESS.labels(endpoint="/api/orders").dec()


@app.route("/api/error")
def error():
    IN_PROGRESS.labels(endpoint="/api/error").inc()
    try:
        elapsed = _work()
        REQUEST_LATENCY.labels(endpoint="/api/error").observe(elapsed)
        ERRORS.labels(endpoint="/api/error").inc()
        REQUEST_COUNT.labels("GET", "/api/error", "500").inc()
        return jsonify({"error": "simulated failure"}), 500
    finally:
        IN_PROGRESS.labels(endpoint="/api/error").dec()


@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


@app.route("/alerts", methods=["POST"])
def alerts():
    payload = request.get_json(silent=True) or {}
    for alert in payload.get("alerts", []):
        print(
            "[ALERT]",
            alert.get("status"),
            alert.get("labels", {}).get("alertname"),
            "-",
            alert.get("annotations", {}).get("summary"),
            flush=True,
        )
    return jsonify({"received": len(payload.get("alerts", []))}), 200


def traffic_generator():
    interval = float(os.getenv("TRAFFIC_INTERVAL", "2"))
    while True:
        try:
            QUEUE.set(random.randint(0, 20))
            REQUEST_COUNT.labels("GET", "/api/orders", "200").inc(random.randint(1, 5))
            ORDERS.inc(random.randint(1, 3))
            ORDERS_VALUE.inc(random.randint(500, 8000))
            REQUEST_LATENCY.labels(endpoint="/api/orders").observe(
                random.uniform(0.02, 0.4)
            )
            if random.random() < 0.25:
                ERRORS.labels(endpoint="/api/error").inc()
                REQUEST_COUNT.labels("GET", "/api/error", "500").inc()
        except Exception:
            pass
        time.sleep(interval)


if __name__ == "__main__":
    threading.Thread(target=traffic_generator, daemon=True).start()
    app.run(host="0.0.0.0", port=8000)
