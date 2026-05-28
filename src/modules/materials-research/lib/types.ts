export type TenantId = "ustc-advanced" | "quantum-center" | "generic";

export type Domain = "polymer" | "battery" | "sic" | "generic-materials";

export interface Tenant {
  id: TenantId;
  name: string;
  shortName: string;
  description: string;
  domains: Domain[];
  defaultProjectId: string;
  branding: {
    platformTitle: string;
    platformTagline: string;
    heroTitle: string;
    heroSubtitle: string;
  };
}

export interface Project {
  id: string;
  tenantId: TenantId;
  name: string;
  subtitle: string;
}
