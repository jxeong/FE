// components/TableCard.tsx
import { AddToCartButton } from './AddToCartButton';

interface TableCardProps {
  title: string;
  uniqueKey: string;
  addToCart: any;
  removeByUniqueKey: any;
  isInCart: any;
  children: React.ReactNode;
}

export function TableCard({
  title,
  uniqueKey,
  addToCart,
  removeByUniqueKey,
  isInCart,
  children,
}: TableCardProps) {
  return (
    <section className="table-card">
      <div className="table-card__header">
        <h2 className="table-card__title">{title}</h2>

        <div className="table-card__actions">
          <AddToCartButton
            onAdd={() =>
              addToCart({
                type: 'table',
                title,
                data: null,
                page: 'dashboard',
                uniqueKey,
              })
            }
            onRemove={() => removeByUniqueKey(uniqueKey)}
            isInCart={isInCart(uniqueKey)}
          />
        </div>
      </div>

      {children}
    </section>
  );
}
