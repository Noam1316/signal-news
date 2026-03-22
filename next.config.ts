import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/brief',   destination: '/dashboard#brief',  permanent: false },
      { source: '/shocks',  destination: '/dashboard#shocks', permanent: false },
      { source: '/intel',   destination: '/dashboard#intel',  permanent: false },
      { source: '/explore', destination: '/dashboard#intel',  permanent: false },
    ];
  },
};

export default nextConfig;
