const Wallet = () => {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-6">
        Billing & Payments
      </h2>
      <p className="text-gray-600">
        Your billing and payment information will appear here.
      </p>

      <div className="mt-4 p-6 bg-gray-50 rounded-md text-center text-gray-500">
        No billing information found.
      </div>
    </div>
  );
};

export default Wallet;
