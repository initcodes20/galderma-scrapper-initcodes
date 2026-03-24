"use client";

import { useState } from "react";
import AddProductModal from "./AddProductModal";
import { useRouter } from "next/navigation";

export default function AddProductButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          background: "linear-gradient(135deg, #16a34a, #059669)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(22,163,74,0.2)",
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0) scale(1)"}
      >
        <span style={{ fontSize: "18px" }}>+</span> Add Product
      </button>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={handleRefresh}
      />
    </>
  );
}
