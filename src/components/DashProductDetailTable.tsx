// components/DashProductDetailTable.tsx
import { TableCard } from "./DashTableCard";
import type { ProductDetailRow } from "../api/dashboard";

function getChangeInfo(change: number) {
  if (change > 0) {
    return {
      className: "change up",
      text: `▲ +${change}`,
    };
  }

  if (change < 0) {
    return {
      className: "change down",
      text: `▼ ${change}`,
    };
  }

  return {
    className: "change neutral",
    text: "변동 없음",
  };
}

interface ProductDetailTableProps {
  data: ProductDetailRow[];
  loading: boolean;
  month: string;
  addToCart: any;
  removeByUniqueKey: any;
  isInCart: any;
}

export function ProductDetailTable({
  data,
  loading,
  month,
  addToCart,
  removeByUniqueKey,
  isInCart,
}: ProductDetailTableProps) {
  return (
    <TableCard
      title="지난 달 베스트 셀러 TOP 5 상세 정보"
      uniqueKey="dashboard-table-product-detail"
      cartPayload={{
        type: "table",
        title: "지난 달 베스트 셀러 TOP 5 상세 정보",
        data,
        page: "dashboard",
        uniqueKey: "dashboard-table-product-detail",
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
              <th>지난 달 판매량</th>
              <th>지난달 순위</th>
              <th>순위 변동</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => {
              const changeInfo = getChangeInfo(item.rankChange);

              return (
                <tr key={item.rank}>
                  <td>
                    <span className="rank-badge">{item.rank}</span>
                  </td>

                  <td>{item.name}</td>

                  <td>{item.sales.toLocaleString()}</td>

                  <td>{item.prevRank != null ? `${item.prevRank}위` : '-'}</td>

                  <td className={changeInfo.className}>{changeInfo.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}
