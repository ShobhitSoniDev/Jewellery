"use client";

export default function DashboardPage() {
  return (
    <>
      {/* Stats */}
      <div className="stats">
        <div className="statCard">Total Items <h3>320</h3></div>
        <div className="statCard green">In Stock <h3>280</h3></div>
        <div className="statCard red">Sold <h3>40</h3></div>
        <div className="statCard orange">Low Stock <h3>12</h3></div>
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="btn primary">+ Add New Item</button>
        <button className="btn">Generate Report</button>
      </div>

      {/* Table */}
      <div className="tableBox">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gold Ring</td>
              <td>Gold</td>
              <td>280</td>
              <td><span className="badge green">Stock</span></td>
            </tr>
            <tr>
              <td>Diamond Ring</td>
              <td>Diamond</td>
              <td>280</td>
              <td><span className="badge orange">Sale</span></td>
            </tr>
            <tr>
              <td>Silver Ring</td>
              <td>Silver</td>
              <td>40</td>
              <td><span className="badge green">Stock</span></td>
            </tr>
            <tr>
              <td>Emerald Ring</td>
              <td>Emerald</td>
              <td>12</td>
              <td><span className="badge red">Left</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
