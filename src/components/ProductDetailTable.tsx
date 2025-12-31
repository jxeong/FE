// components/ProductDetailTable.tsx
import { TableCard } from './TableCard';

type ProductItem = {
  rank: number;
  name: string;
  sales: number;
  prev: number;
  change: number;
};

const data: ProductItem[] = [
  { rank: 1, name: 'Water Sleeping Mask', sales: 2840, prev: 3, change: 2 },
  { rank: 2, name: 'Lip Sleeping Mask', sales: 2180, prev: 1, change: +1 },
  { rank: 3, name: 'Cream Skin Refiner', sales: 1956, prev: 4, change: 1 },
  { rank: 4, name: 'Water Bank Moisture Cream', sales: 1742, prev: 7, change: -3 },
  { rank: 5, name: 'Neo Cushion', sales: 1598, prev: 5, change: 0 },
];

function getChangeInfo(change: number) {
  if (change > 0) {
    return {
      className: 'change up',
      text: `▲ +${change}`,
    };
  }

  if (change < 0) {
    return {
      className: 'change down',
      text: `▼ ${change}`,
    };
  }

  return {
    className: 'change neutral',
    text: '변동 없음',
  };
}

export function ProductDetailTable(props: any) {
  return (
    <TableCard
      title="제품별 상세 현황"
      uniqueKey="dashboard-table-detail"
      {...props}
    >
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
            const changeInfo = getChangeInfo(item.change);

            return (
              <tr key={item.rank}>
                <td>
                  <span className="rank-badge">{item.rank}</span>
                </td>

                <td>{item.name}</td>

                <td>{item.sales.toLocaleString()}</td>

                <td>{item.prev}위</td>

                <td className={changeInfo.className}>
                  {changeInfo.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableCard>
  );
}
