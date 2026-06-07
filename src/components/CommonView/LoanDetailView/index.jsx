import React from "react";

const LoanDetailViewModal = ({ open, data, onClose }) => {
  if (!open || !data) return null;

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="custom-modal-overlay">
      <div
        className="custom-modal"
        style={{
          width: "1000px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "15px 20px",
            background: "#1976d2",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>Loan Details</h2>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#fff",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ✖
          </button>
        </div>

        <div style={{ padding: "10px" }}>
         

          {/* Details Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "5px",
            }}
          >
            {Object.entries(data).map(([key, value]) => {
              if (
                key === "Photos" ||
                key === "PhotoPath" ||
                key === "PhotoUrls"
              ) {
                return null;
              }

              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "5px",
                    }}
                  >
                    {formatLabel(key)}
                  </div>

                  <div
                    style={{
                      fontWeight: "600",
                      color: "#222",
                    }}
                  >
                    {value === null ||
                    value === undefined ||
                    value === ""
                      ? "-"
                      : value.toString()}
                  </div>
                </div>
              );
            })}
          </div>

 {/* Images Section */}
          {data.PhotoUrls?.length > 0 && (
            <>
              <h3
                style={{
                  marginBottom: "15px",
                  color: "#1976d2",
                }}
              >
                Loan Photos
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "25px",
                }}
              >
                {data.PhotoUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Photo ${index + 1}`}
                    onClick={() => window.open(url, "_blank")}
                    style={{
                      width: "160px",
                      height: "160px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      transition: "0.3s",
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {/* Footer */}
          <div
            style={{
              textAlign: "right",
              marginTop: "25px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailViewModal;