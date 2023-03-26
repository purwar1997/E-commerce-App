const razorpayBtn = document.getElementById('razorpay-btn');

razorpayBtn.addEventListener('click', async event => {
  event.preventDefault();

  const response = await fetch('http://localhost:4000/api/v1/razorpayOrder', {
    method: 'POST',
    body: JSON.stringify({
      amount: 1000,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const { order } = await response.json();

  const options = {
    key: 'rzp_test_XiDAviH4byvbOl',
    amount: order.amount,
    currency: order.currency,
    name: 'Amazon',
    description: 'Test transaction for razorpay integration',
    order_id: order.id,
    handler: async function (response) {
      await fetch('http://localhost:4000/api/v1/order', {
        method: 'POST',
        body: JSON.stringify({ paymentId: response.razorpay_payment_id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    prefill: {
      name: 'Shubham Purwar',
      email: 'shubhampurwar35@gmail.com',
      contact: '+919897887871',
      method: 'card',
    },
    theme: {
      color: '#1FAA59',
    },
    remember_customer: true,
  };

  const paymentIntent = new Razorpay(options);
  paymentIntent.open();
});
