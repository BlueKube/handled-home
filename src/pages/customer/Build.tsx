import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 2A-06: "Build My Service Day" is the Routine flow.
 * This page redirects to /customer/routine which already implements
 * the full bundle builder (SKU browser, cadence picker, entitlement guardrails, 4-week preview).
 */
export default function CustomerBuild() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/customer/routine", { replace: true });
  }, [navigate]);

  return null;
}
