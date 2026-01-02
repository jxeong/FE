// components/DashTableCard.tsx
import { AddToCartButton } from "./AddToCartButton";

interface TableCardProps {
  title: string;
  uniqueKey: string;

  cartPayload: {
    type: string;
    title: string;
    data: any;
    page: string;
    uniqueKey: string;
  };

  addToCart: any;
  removeByUniqueKey: any;
  isInCart: any;
  children: React.ReactNode;
}

export function TableCard({
  title,
  uniqueKey,
  cartPayload,
  addToCart,
  removeByUniqueKey,
  isInCart,
  children,
}: TableCardProps) {
  return (
    <section className="table-card">
      <div className="table-card__header">
        <h2 className="table-card__title">{title}</h2>

        <AddToCartButton
          onAdd={() => addToCart(cartPayload)}
          onRemove={() => removeByUniqueKey(cartPayload.uniqueKey)}
          isInCart={isInCart(cartPayload.uniqueKey)}
        />
      </div>

      {children}
    </section>
  );
}
