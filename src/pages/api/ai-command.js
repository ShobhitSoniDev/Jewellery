export default function handler(req, res) {
  // ✅ Only POST allow
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const text = input.toLowerCase().trim();

    // =========================
    // 🔥 METAL COMMAND
    // =========================
    // Example: add metal gold 18 carat
    const metalPattern = /add\s+metal\s+(\w+)\s+(\d+)/i;

    if (metalPattern.test(text)) {
      const match = text.match(metalPattern);

      return res.status(200).json({
        page: "metal",
        action: "add",
        data: {
          metalname: capitalize(match[1]),
          purity: match[2]
        }
      });
    }

    // =========================
    // 🔥 CATEGORY COMMAND
    // =========================
    // Example: add category gold jewellery
    const categoryPattern = /add\s+category\s+(.+)/i;

    if (categoryPattern.test(text)) {
      const match = text.match(categoryPattern);

      return res.status(200).json({
        page: "category",
        action: "add",
        data: {
          categoryname: capitalize(match[1])
        }
      });
    }

    // =========================
    // 🔥 PRODUCT COMMAND
    // =========================
    // Example: add product ring
    const productPattern = /add\s+product\s+(.+)/i;

    if (productPattern.test(text)) {
      const match = text.match(productPattern);

      return res.status(200).json({
        page: "product",
        action: "add",
        data: {
          productname: capitalize(match[1])
        }
      });
    }

    // =========================
    // 🔥 FALLBACKS
    // =========================
    if (text.includes("metal")) {
      return res.status(200).json({
        page: "metal",
        action: "add",
        data: {
          metalname: "Gold",
          purity: "18"
        }
      });
    }

    if (text.includes("category")) {
      return res.status(200).json({
        page: "category",
        action: "add",
        data: {
          categoryname: "Default Category"
        }
      });
    }

    if (text.includes("product")) {
      return res.status(200).json({
        page: "product",
        action: "add",
        data: {
          productname: "Default Product"
        }
      });
    }

    // ❌ अगर समझ नहीं आया
    return res.status(200).json({
      error: "Command not recognized"
    });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// 🔹 Helper function
function capitalize(text) {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}