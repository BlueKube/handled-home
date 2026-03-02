import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryRequirement {
  id: string;
  category_key: string;
  risk_tier: number;
  requires_gl_insurance: boolean;
  requires_coi_upload: boolean;
  requires_license: boolean;
  license_authority: string | null;
  requires_background_check: boolean;
  requires_workers_comp_if_employees: boolean;
  requires_in_home_access: boolean;
  ops_review_required: boolean;
}

/**
 * Fetches category_requirements rows for the given category keys.
 * Returns a merged "max" requirement set + per-category details.
 */
export function useCategoryRequirements(categoryKeys: string[]) {
  const query = useQuery({
    queryKey: ["category_requirements", categoryKeys],
    enabled: categoryKeys.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_requirements")
        .select("*")
        .in("category_key", categoryKeys);
      if (error) throw error;
      return (data ?? []) as CategoryRequirement[];
    },
  });

  // Merge: if ANY selected category requires something, it's required
  const merged = query.data?.reduce<{
    maxRiskTier: number;
    requiresGlInsurance: boolean;
    requiresCoiUpload: boolean;
    requiresLicense: boolean;
    licenseAuthorities: string[];
    requiresBackgroundCheck: boolean;
    requiresWorkersComp: boolean;
    requiresInHomeAccess: boolean;
    opsReviewRequired: boolean;
    categoriesRequiringLicense: string[];
    categoriesRequiringCoi: string[];
  }>(
    (acc, r) => ({
      maxRiskTier: Math.max(acc.maxRiskTier, r.risk_tier),
      requiresGlInsurance: acc.requiresGlInsurance || r.requires_gl_insurance,
      requiresCoiUpload: acc.requiresCoiUpload || r.requires_coi_upload,
      requiresLicense: acc.requiresLicense || r.requires_license,
      licenseAuthorities: r.license_authority
        ? [...acc.licenseAuthorities, r.license_authority]
        : acc.licenseAuthorities,
      requiresBackgroundCheck: acc.requiresBackgroundCheck || r.requires_background_check,
      requiresWorkersComp: acc.requiresWorkersComp || r.requires_workers_comp_if_employees,
      requiresInHomeAccess: acc.requiresInHomeAccess || r.requires_in_home_access,
      opsReviewRequired: acc.opsReviewRequired || r.ops_review_required,
      categoriesRequiringLicense: r.requires_license
        ? [...acc.categoriesRequiringLicense, r.category_key]
        : acc.categoriesRequiringLicense,
      categoriesRequiringCoi: r.requires_coi_upload
        ? [...acc.categoriesRequiringCoi, r.category_key]
        : acc.categoriesRequiringCoi,
    }),
    {
      maxRiskTier: 0,
      requiresGlInsurance: false,
      requiresCoiUpload: false,
      requiresLicense: false,
      licenseAuthorities: [],
      requiresBackgroundCheck: false,
      requiresWorkersComp: false,
      requiresInHomeAccess: false,
      opsReviewRequired: false,
      categoriesRequiringLicense: [],
      categoriesRequiringCoi: [],
    }
  );

  return {
    requirements: query.data ?? [],
    merged: merged ?? null,
    isLoading: query.isLoading,
  };
}
