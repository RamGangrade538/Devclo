import json
import os

from generator import build_pdf

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "resume_data.json")
OUT = os.path.join(BASE, "output", "RamGangrade_SDET_Resume.pdf")


def main():
    with open(DATA) as fh:
        data = json.load(fh)
    pdf = build_pdf(data)
    with open(OUT, "wb") as fh:
        fh.write(pdf)
    print(f"built {OUT} ({len(pdf)} bytes)")


if __name__ == "__main__":
    main()