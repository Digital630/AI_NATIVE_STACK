import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const galleryItems = [
  {
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    caption: "SME business development meeting",
    alt: "Business professionals in a meeting"
  },
  {
    src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
    caption: "Agricultural trade operations",
    alt: "Agricultural products and trade"
  },
  {
    src: "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=600&h=400&fit=crop",
    caption: "Coffee export preparation",
    alt: "Coffee beans ready for export"
  },
  {
    src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=400&fit=crop",
    caption: "Logistics and shipping operations",
    alt: "Container shipping and logistics"
  },
  {
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=400&fit=crop",
    caption: "SME capacity building workshop",
    alt: "Training workshop session"
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop",
    caption: "Financial documentation review",
    alt: "Team reviewing financial documents"
  },
  {
    src: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=600&h=400&fit=crop",
    caption: "Cashew nut processing facility",
    alt: "Cashew nut processing"
  },
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
    caption: "Trade readiness assessment",
    alt: "Business assessment meeting"
  },
  {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop",
    caption: "Partnership development session",
    alt: "Team collaboration meeting"
  }
];

const Gallery = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Gallery</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            A visual overview of SME trade activities and AgriSMES initiatives across our operating countries.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, index) => (
              <div key={index} className="group overflow-hidden rounded-lg border border-border bg-card">
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">{item.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
