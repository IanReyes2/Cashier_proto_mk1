// pages/api/ready-orders.ts
let readyOrders: any[] = [];

export default function handler(req: any, res: any) {
  if (req.method === "POST") {
    // Add a confirmed order
    const order = req.body;
    readyOrders.push(order);
    return res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    // Return all confirmed orders
    return res.status(200).json(readyOrders);
  }

  res.status(405).end();
}
