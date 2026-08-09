import React from "react";
import {
  FaBoxOpen,
  FaWallet,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaDownload,
  FaSyncAlt,
  FaPhoneAlt,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import CustomerLayout from "@/pages/Customer/layout";

/**
 * Static demo data — swap these arrays/objects for your real API
 * response once the customer dashboard endpoint is ready.
 */
const STATS = [
  {
    label: "Active Pledges",
    value: "3",
    icon: FaBoxOpen,
    tone: "emerald",
  },
  {
    label: "Total Loan Value",
    value: "₹1,85,000",
    icon: FaWallet,
    tone: "gold",
  },
  {
    label: "Outstanding Due",
    value: "₹12,400",
    icon: FaExclamationTriangle,
    tone: "rose",
  },
  {
    label: "Next Due Date",
    value: "15 Sep 2026",
    icon: FaCalendarAlt,
    tone: "emerald",
  },
];

const PLEDGED_ITEMS = [
  {
    id: "PLG-1042",
    name: "Gold Necklace Set",
    weight: "42.5g · 22K",
    loanAmount: "₹95,000",
    pledgeDate: "12 Mar 2026",
    dueDate: "12 Sep 2026",
    status: "Active",
  },
  {
    id: "PLG-1078",
    name: "Gold Bangles (Pair)",
    weight: "28.0g · 22K",
    loanAmount: "₹58,000",
    pledgeDate: "04 May 2026",
    dueDate: "04 Nov 2026",
    status: "Active",
  },
  {
    id: "PLG-0961",
    name: "Silver Anklets",
    weight: "60.0g · 92.5",
    loanAmount: "₹32,000",
    pledgeDate: "20 Jan 2026",
    dueDate: "20 Jul 2026",
    status: "Overdue",
  },
];

const TRANSACTIONS = [
  {
    id: 1,
    label: "Interest Payment — PLG-1042",
    date: "02 Aug 2026",
    amount: "₹2,850",
    type: "debit",
  },
  {
    id: 2,
    label: "Partial Repayment — PLG-0961",
    date: "18 Jul 2026",
    amount: "₹10,000",
    type: "debit",
  },
  {
    id: 3,
    label: "New Pledge Disbursed — PLG-1078",
    date: "04 May 2026",
    amount: "₹58,000",
    type: "credit",
  },
  {
    id: 4,
    label: "Interest Payment — PLG-1042",
    date: "12 Apr 2026",
    amount: "₹2,850",
    type: "debit",
  },
];

const STATUS_CLASS = {
  Active: "isActive",
  Overdue: "isOverdue",
  Closed: "isClosed",
};

const CustomerDashboard = () => {
  return (
    <CustomerLayout>
      {/* Due alert */}
      <div className="custAlertBanner">
        <FaExclamationTriangle />
        <p>
          <strong>₹12,400</strong> due on <strong>15 Sep 2026</strong> for your silver anklets
          pledge — clear it early to avoid late fees.
        </p>
        <button className="custAlertBtn">Pay Now</button>
      </div>

      {/* Stat cards */}
      <section className="custStatGrid">
        {STATS.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`custStatCard tone-${tone}`}>
            <span className="custStatIcon">
              <Icon />
            </span>
            <div>
              <span className="custStatLabel">{label}</span>
              <strong className="custStatValue">{value}</strong>
            </div>
          </div>
        ))}
      </section>

      <div className="custDashGrid">
        {/* Pledged items */}
        <section className="custPanelCard custPledgeCard">
          <div className="custCardHeader">
            <h3>My Pledged Items</h3>
            <span className="custCardHeaderNote">3 items</span>
          </div>

          <div className="custTableWrap">
            <table className="custTable">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Loan Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {PLEDGED_ITEMS.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <span className="custTableSub">
                        {item.id} · {item.weight}
                      </span>
                    </td>
                    <td>{item.loanAmount}</td>
                    <td>{item.dueDate}</td>
                    <td>
                      <span className={`custStatusBadge ${STATUS_CLASS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent activity */}
        <section className="custPanelCard custActivityCard">
          <div className="custCardHeader">
            <h3>Recent Activity</h3>
          </div>

          <ul className="custActivityList">
            {TRANSACTIONS.map((tx) => (
              <li key={tx.id}>
                <span className={`custActivityIcon ${tx.type}`}>
                  {tx.type === "credit" ? <FaArrowDown /> : <FaArrowUp />}
                </span>
                <div className="custActivityBody">
                  <strong>{tx.label}</strong>
                  <span>{tx.date}</span>
                </div>
                <span className={`custActivityAmount ${tx.type}`}>
                  {tx.type === "credit" ? "+" : "−"} {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick actions */}
      <section className="custQuickActions">
        <button className="custQuickAction">
          <FaDownload />
          <span>Download Statement</span>
        </button>
        <button className="custQuickAction">
          <FaSyncAlt />
          <span>Renew a Pledge</span>
        </button>
        <button className="custQuickAction">
          <FaPhoneAlt />
          <span>Contact Shop</span>
        </button>
      </section>
    </CustomerLayout>
  );
};

export default CustomerDashboard;
