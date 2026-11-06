import type { Product } from "@ecommerce/shared";
import { getProducts } from "@/lib/api";

function formatPrice(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export default async function HomePage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    const data = await getProducts();
    products = data.items;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load products";
  }

  return (
    <div>
      <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Shop the latest</h1>
        <p className="mt-1 text-slate-600">
          Product catalog powered by the Express + Prisma API.
        </p>
      </section>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Could not reach the API ({error}). Start it with{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev:api</code> and
          seed the DB.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <span className="text-4xl">🛍️</span>
              )}
            </div>
            <h2 className="font-semibold">{product.name}</h2>
            {product.category && (
              <span className="text-xs uppercase tracking-wide text-brand-600">
                {product.category.name}
              </span>
            )}
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
              {product.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold">
                {formatPrice(product.price, product.currency)}
              </span>
              <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                Add to cart
              </button>
            </div>
          </article>
        ))}
      </div>

      {!error && products.length === 0 && (
        <p className="text-slate-500">
          No products yet. Run <code>npm run db:seed</code> to add sample data.
        </p>
      )}
    </div>
  );
}
