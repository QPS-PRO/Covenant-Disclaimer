// frontend/src/widgets/layout/index.js
export * from "@/widgets/layout/sidenav";
export * from "@/widgets/layout/dashboard-navbar";
export * from "@/widgets/layout/configurator";
export * from "@/widgets/layout/footer";
export * from "@/widgets/layout/navbar";

// Make sure we also export the default exports
export { default as Sidenav } from "@/widgets/layout/sidenav";
export { default as DashboardNavbar } from "@/widgets/layout/dashboard-navbar";
export { default as Configurator } from "@/widgets/layout/configurator";
export { default as Footer } from "@/widgets/layout/footer";
export { default as Navbar } from "@/widgets/layout/navbar";