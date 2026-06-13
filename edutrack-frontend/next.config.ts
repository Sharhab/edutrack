import path from "path";

const nextConfig = {
  output: "export",
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;