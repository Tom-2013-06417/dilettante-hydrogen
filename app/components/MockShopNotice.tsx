export function MockShopNotice() {
  return (
    <section
      className="mock-shop-notice"
      aria-labelledby="mock-shop-notice-heading"
    >
      <div className="inner">
        <h2 id="mock-shop-notice-heading">Dilettante Hydrogen</h2>
        <p>
          You&rsquo;re seeing mock.shop products because no store is connected
          yet.
        </p>
        <p>
          Link a store by running <code>npx shopify hydrogen link</code> in your
          terminal.
        </p>
      </div>
    </section>
  );
}
