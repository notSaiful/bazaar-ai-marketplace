import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/.well-known/ucp"], disallow: ["/admin", "/seller", "/api/", "/pay/", "/orders", "/checkout", "/cart"] }] };
}
