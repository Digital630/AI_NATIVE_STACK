import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Awards = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Awards & Recognition</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Acknowledgments and recognitions received by AgriSMES for our work in SME trade readiness.
          </p>
          
          <div className="bg-muted/30 rounded-lg p-8 md:p-12 text-center max-w-2xl border border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-muted-foreground" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                />
              </svg>
            </div>
            <p className="text-muted-foreground text-lg">
              No awards published yet.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Awards and recognitions will be displayed here when available.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Awards;
