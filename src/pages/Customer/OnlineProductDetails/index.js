"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import CustomerLayout from "@/pages/Customer/layout";
import {
  GetOnline_ProductList,
  Customer_Wishlist_Manage,
} from "@/lib/services/CustomerService";

import {
  MetalMaster_Manage,
  CategoryMaster_Manage,
} from "@/lib/services/MasterService";


const OnlineProductList = () => {

  const router = useRouter();

  // ============================================================
  // ROUTE CONFIG
  // ============================================================

  const PRODUCT_DETAIL_ROUTE = "/Customer/OnlineProductFullDetail";

  // ============================================================
  // PRODUCT LIST
  // ============================================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // FILTERS
  // ============================================================

  const [searchText, setSearchText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [metalId, setMetalId] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // ============================================================
  // MASTER DATA
  // ============================================================

  const [categories, setCategories] = useState([]);
  const [metals, setMetals] = useState([]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasNextPage, setHasNextPage] = useState(false);

  // ============================================================
  // WISHLIST TRACKING (for card heart icon)
  // ============================================================

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistBusyId, setWishlistBusyId] = useState(null);



  // ============================================================
  // Load Categories
  // ============================================================

  const loadCategories = async () => {

    try {

      const res = await CategoryMaster_Manage({ TypeId: 4 });

      setCategories(res?.data || []);

    } catch (error) {

      console.error("Category load error:", error);

      setCategories([]);
    }
  };


  // ============================================================
  // Load Metals
  // ============================================================

  const loadMetals = async () => {

    try {

      const res = await MetalMaster_Manage({ TypeId: 4 });

      setMetals(res?.data || []);

    } catch (error) {

      console.error("Metal load error:", error);

      setMetals([]);
    }
  };


  // ============================================================
  // Load Wishlist Ids (to mark hearts on cards)
  // ============================================================

  const loadWishlistIds = async () => {

     try {

      const res = await Customer_Wishlist_Manage({
        TypeId: 2,
      });

      if (res?.code === 1 && Array.isArray(res?.data)) {

        setWishlistIds(res.data.map((item) => item.ProductId));
      }

    } catch (error) {

      console.error("Wishlist load error:", error);
    }
  };


  // ============================================================
  // Load Product List
  // ============================================================

  const loadProducts = async (requestedPage = pageNumber) => {

    try {

      setLoading(true);

      const payload = {
        CategoryId: categoryId ? Number(categoryId) : null,
        MetalId: metalId ? Number(metalId) : null,
        SearchText: searchText?.trim() || null,
        OnlyFeatured: onlyFeatured,
        PageNumber: requestedPage,
        PageSize: pageSize,
      };

      const res = await GetOnline_ProductList(payload);

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setProducts(list);

      setHasNextPage(list.length === pageSize);

    } catch (error) {

      console.error("Product list error:", error);

      setProducts([]);

      Swal.fire({
        icon: "error",
        title: "Unable to load products",
        text: "Something went wrong while loading products.",
      });

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadCategories();
    loadMetals();
    loadProducts(1);
    loadWishlistIds();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = () => {

    setPageNumber(1);

    loadProducts(1);
  };


  // ============================================================
  // CLEAR FILTER
  // ============================================================

  const clearFilters = () => {

    setSearchText("");
    setCategoryId("");
    setMetalId("");
    setOnlyFeatured(false);

    setPageNumber(1);

    setTimeout(() => {
      loadProducts(1);
    }, 0);
  };


  // ============================================================
  // CATEGORY / METAL / FEATURED CHANGE
  // ============================================================

  const handleCategoryChange = (value) => {

    setCategoryId(value);
    setPageNumber(1);

    loadProductsWithFilters({
      category: value,
      metal: metalId,
      search: searchText,
      featured: onlyFeatured,
      page: 1,
    });
  };

  const handleMetalChange = (value) => {

    setMetalId(value);
    setPageNumber(1);

    loadProductsWithFilters({
      category: categoryId,
      metal: value,
      search: searchText,
      featured: onlyFeatured,
      page: 1,
    });
  };

  const handleFeaturedChange = (value) => {

    setOnlyFeatured(value);
    setPageNumber(1);

    loadProductsWithFilters({
      category: categoryId,
      metal: metalId,
      search: searchText,
      featured: value,
      page: 1,
    });
  };


  // ============================================================
  // FILTER LOAD
  // ============================================================

  const loadProductsWithFilters = async ({
    category,
    metal,
    search,
    featured,
    page,
  }) => {

    try {

      setLoading(true);

      const payload = {
        CategoryId: category ? Number(category) : null,
        MetalId: metal ? Number(metal) : null,
        SearchText: search?.trim() || null,
        OnlyFeatured: featured,
        PageNumber: page,
        PageSize: pageSize,
      };

      const res = await GetOnline_ProductList(payload);

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setProducts(list);

      setHasNextPage(list.length === pageSize);

    } catch (error) {

      console.error(error);

      setProducts([]);

    } finally {

      setLoading(false);

    }
  };


  // ============================================================
  // PAGE SIZE CHANGE
  // ============================================================

  const handlePageSizeChange = (value) => {

    const size = Number(value);

    setPageSize(size);
    setPageNumber(1);

    setTimeout(() => {

      loadProductsWithFilters({
        category: categoryId,
        metal: metalId,
        search: searchText,
        featured: onlyFeatured,
        page: 1,
      });

    }, 0);
  };


  // ============================================================
  // NEXT / PREVIOUS PAGE
  // ============================================================

  const handleNextPage = () => {

    if (!hasNextPage || loading) return;

    const nextPage = pageNumber + 1;

    setPageNumber(nextPage);

    loadProductsWithFilters({
      category: categoryId,
      metal: metalId,
      search: searchText,
      featured: onlyFeatured,
      page: nextPage,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreviousPage = () => {

    if (pageNumber <= 1 || loading) return;

    const previousPage = pageNumber - 1;

    setPageNumber(previousPage);

    loadProductsWithFilters({
      category: categoryId,
      metal: metalId,
      search: searchText,
      featured: onlyFeatured,
      page: previousPage,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  // ============================================================
  // PRODUCT CLICK -> Go to details page
  // ============================================================

  const handleProductClick = (productId) => {

    router.push(`${PRODUCT_DETAIL_ROUTE}?ProductId=${productId}`);
  };


  // ============================================================
  // WISHLIST TOGGLE (from card, without opening details)
  // ============================================================

  const handleWishlistToggle = async (e, productId) => {

    e.stopPropagation();

    if (wishlistBusyId === productId) return;


    try {

      setWishlistBusyId(productId);

      const res = await Customer_Wishlist_Manage({
        TypeId: 1,
        ProductId: productId,
      });

      if (res?.code === 1) {

        if (res.data?.isAdded) {

          setWishlistIds((prev) => [...prev, productId]);

        } else {

          setWishlistIds((prev) => prev.filter((id) => id !== productId));
        }
debugger
        Swal.fire({
          icon: "success",
          title: res.data?.isAdded
            ? "Added to Wishlist"
            : "Removed from Wishlist",
          timer: 1000,
          showConfirmButton: false,
        });

      } else {

        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.Message || "Unable to update wishlist.",
        });
      }

    } catch (error) {

      console.error("Wishlist toggle error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "Unable to update wishlist. Please try again.",
      });

    } finally {

      setWishlistBusyId(null);

    }
  };


  // ============================================================
  // IMAGE URL
  // ============================================================

  const getImageUrl = (product) => {

    return product.PrimaryImageUrl || "/images/no-product-image.png";
  };


  return (
    <CustomerLayout>
      <div className="online-product-page">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="product-list-header">

          <div>
            <h1>Our Jewellery Collection</h1>
            <p>Discover jewellery crafted for every special moment.</p>
          </div>

        </div>


        {/* ====================================================
            FILTER SECTION
        ===================================================== */}

        <div className="product-filter-card">

          <div className="filter-header">

            <div>
              <h3>Find Your Perfect Jewellery</h3>
              <span>Search and filter products easily</span>
            </div>

            <button className="clear-filter-btn" onClick={clearFilters}>
              Clear Filters
            </button>

          </div>


          <div className="filter-grid">

            {/* Search */}

            <div className="filter-group search-group">

              <label>Search Product</label>

              <div className="search-input-wrapper">

                <span>🔍</span>

                <input
                  type="text"
                  value={searchText}
                  placeholder="Search by product name or code..."
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />

                <button onClick={handleSearch}>Search</button>

              </div>

            </div>


            {/* Category */}

            <div className="filter-group">

              <label>Category</label>

              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >

                <option value="">All Categories</option>

                {categories.map((category) => (
                  <option key={category.CategoryId} value={category.CategoryId}>
                    {category.CategoryName}
                  </option>
                ))}

              </select>

            </div>


            {/* Metal */}

            <div className="filter-group">

              <label>Metal</label>

              <select
                value={metalId}
                onChange={(e) => handleMetalChange(e.target.value)}
              >

                <option value="">All Metals</option>

                {metals.map((metal) => (
                  <option key={metal.MetalId} value={metal.MetalId}>
                    {metal.MetalDesc || metal.MetalName}
                  </option>
                ))}

              </select>

            </div>


            {/* Featured */}

            <div className="filter-group featured-filter">

              <label>Product Type</label>

              <label className="featured-checkbox">

                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => handleFeaturedChange(e.target.checked)}
                />

                <span>⭐ Featured Products</span>

              </label>

            </div>

          </div>

        </div>


        {/* ====================================================
            RESULT HEADER
        ===================================================== */}

        <div className="product-result-header">

          <div>

            <strong>
              {loading ? "Loading..." : `${products.length} Products`}
            </strong>

            <span>{searchText ? ` for "${searchText}"` : ""}</span>

          </div>


          <div className="page-size">

            <label>Show</label>

            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >

              <option value="12">12</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>

            </select>

            <span>per page</span>

          </div>

        </div>


        {/* ====================================================
            PRODUCT GRID
        ===================================================== */}

        {loading ? (

          <div className="product-grid">

            {Array.from({ length: 8 }).map((_, index) => (

              <div className="product-skeleton" key={index}>
                <div className="skeleton-image"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line small"></div>
                <div className="skeleton-line tiny"></div>
              </div>

            ))}

          </div>

        ) : products.length > 0 ? (

          <div className="product-grid">

            {products.map((product) => (

              <div
                className="product-card"
                key={product.ProductId}
                onClick={() => handleProductClick(product.ProductId)}
              >

                {/* Image */}

                <div className="product-card-image">

                  {product.IsFeatured && (
                    <span className="featured-product-badge">
                      ⭐ Featured
                    </span>
                  )}

                  <button
                    className={`card-wishlist ${
                      wishlistIds.includes(product.ProductId) ? "active" : ""
                    }`}
                    onClick={(e) =>
                      handleWishlistToggle(e, product.ProductId)
                    }
                    disabled={wishlistBusyId === product.ProductId}
                  >
                    {wishlistIds.includes(product.ProductId) ? "♥" : "♡"}
                  </button>

                  <img
                    src={getImageUrl(product)}
                    alt={product.ProductName}
                  />

                </div>


                {/* Content */}

                <div className="product-card-content">

                  <div className="product-card-code">
                    {product.ProductCode}
                  </div>

                  <h3>{product.ProductName}</h3>


                  <div className="product-meta">
                    <span>{product.MetalName}</span>
                    <span>{product.CategoryName}</span>
                  </div>


                  {product.ShortDescription && (
                    <p>{product.ShortDescription}</p>
                  )}


                  <div className="product-weight">
                    <span>Gross Weight</span>
                    <strong>{product.GrossWeight} g</strong>
                  </div>


                  <div className="product-card-footer">
                    <span className="view-product">View Details →</span>
                  </div>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="no-products">

            <div className="no-product-icon">🔍</div>

            <h2>No Products Found</h2>

            <p>We couldn't find any products matching your filters.</p>

            <button onClick={clearFilters}>Clear Filters</button>

          </div>

        )}


        {/* ====================================================
            PAGINATION
        ===================================================== */}

        {!loading && products.length > 0 && (

          <div className="pagination">

            <button
              disabled={pageNumber <= 1}
              onClick={handlePreviousPage}
            >
              ← Previous
            </button>


            <div className="page-number">
              Page <strong>{pageNumber}</strong>
            </div>


            <button
              disabled={!hasNextPage}
              onClick={handleNextPage}
            >
              Next →
            </button>

          </div>

        )}

      </div>
    </CustomerLayout>
  );
};

export default OnlineProductList;