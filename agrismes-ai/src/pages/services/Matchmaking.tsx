import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Legacy Matchmaking page - redirects to Explore Listings (Single Source of Truth)
 * All listings now live at /explore-listings
 */
export default function Matchmaking() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new unified listings page
    navigate("/explore-listings", { replace: true });
  }, [navigate]);

  return null;
}
