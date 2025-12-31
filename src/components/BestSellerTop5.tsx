// components/BestSellerTop5.tsx
import { TableCard } from './TableCard';
import { Star } from 'lucide-react';

const data = [
  { rank: 1, name: 'Water Sleeping Mask', sales: 2840, rating: 4.7, reviews: 3245 },
  { rank: 2, name: 'Lip Sleeping Mask', sales: 2180, rating: 4.8, reviews: 4521 },
  { rank: 3, name: 'Cream Skin Refiner', sales: 1956, rating: 4.6, reviews: 2108 },
  { rank: 4, name: 'Water Bank Moisture Cream', sales: 1742, rating: 4.5, reviews: 1876 },
  { rank: 5, name: 'Neo Cushion', sales: 1598, rating: 4.7, reviews: 2934 },
];

export function BestSellerTop5(props: any) {
  return (
    <TableCard
      title="지난 달 베스트 셀러 TOP 5"
      uniqueKey="dashboard-table-top5"
      {...props}
    >
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
    </TableCard>
  );
}
