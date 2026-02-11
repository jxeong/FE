import { TableCard } from "./DashTableCard";
import { Star } from "lucide-react";
import type { BestSellerTop5Row } from "../api/dashboard";

interface BestSellerTop5Props {
  data: BestSellerTop5Row[];
  loading: boolean;
  month: string;
  addToCart: any;
  removeByUniqueKey: any;
  isInCart: any;
}

export function BestSellerTop5({
  data,
  loading,
  month,
  addToCart,
  removeByUniqueKey,
  isInCart,
}: BestSellerTop5Props) {
  return (
    <TableCard
      title="지난 달 베스트 셀러 TOP 5"
      uniqueKey="dashboard-table-top5"
      cartPayload={{
        type: "table",
        title: "지난 달 베스트 셀러 TOP 5",
        data, // ← BestSellerTop5에 내려온 data 그대로
        page: "dashboard",
        uniqueKey: "dashboard-table-top5",
        meta: {
          kind: "dashboard-table-top5",
          month,
        },
      }}
      addToCart={addToCart}
      removeByUniqueKey={removeByUniqueKey}
      isInCart={isInCart}
    >
      {loading ? (
        <div className="table-loading">로딩 중...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>순위</th>
              <th>제품명</th>
              <th>판매량</th>
              <th>평점</th>
              <th>리뷰 수</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.rank}>
                <td>
                  <span className="rank-badge">{item.rank}</span>
                </td>
                <td>{item.name}</td>
                <td>{item.sales.toLocaleString()}</td>
                <td className="rating">
                  <div className="rating__inner">
                    <Star size={16} fill="#FFA82F" color="#FFA82F" />
                    {item.rating}
                  </div>
                </td>
                <td>{item.reviews.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}
