import { withAuth } from "next-auth/middleware";
import { isMiddlewareTokenAuthorized } from "@/lib/auth-role";

export default withAuth({
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      return isMiddlewareTokenAuthorized(req.nextUrl.pathname, token);
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/projects/:path*/edit",
  ],
};
