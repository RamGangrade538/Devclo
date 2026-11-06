import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@ecommerce.local" },
    update: {},
    create: {
      email: "admin@ecommerce.local",
      name: "Admin",
      password,
      role: "ADMIN",
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const apparel = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: { name: "Apparel", slug: "apparel" },
  });

  const products = [
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Over-ear noise cancelling headphones.",
      price: 799900,
      stock: 25,
      categoryId: electronics.id,
    },
    {
      name: "Mechanical Keyboard",
      slug: "mechanical-keyboard",
      description: "TKL mechanical keyboard with hot-swap switches.",
      price: 1099900,
      stock: 15,
      categoryId: electronics.id,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-tshirt",
      description: "100% cotton crew neck t-shirt.",
      price: 99900,
      stock: 100,
      categoryId: apparel.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log("Seed complete. Admin: admin@ecommerce.local / admin1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
