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
        className="btn btn-primary"
      >
        <span style={{ fontSize: "18px", fontWeight: "300" }}>+</span> Add Tracker
      </button>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={handleRefresh}
      />
    </>
  );
}
