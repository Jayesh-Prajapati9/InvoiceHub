import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { format, parseISO } from 'date-fns';

interface IncomeExpenseChartProps {
  contactId: string;
  months?: number;
}

const IncomeExpenseChart = ({ contactId, months = 4 }: IncomeExpenseChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['contactIncomeExpense', contactId, months],
    queryFn: async () => {
      const res = await api.get(`/contacts/${contactId}/income-expense?months=${months}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  // Format chart data - ensure all months are included even if empty
  const chartData = (data?.chartData || []).map((item: any) => ({
    month: format(parseISO(`${item.month}-01`), 'MMM yyyy'),
    income: Number(item.income || 0),
    expense: Number(item.expense || 0),
  }));
  
  // Ensure we have exactly the requested number of months
  if (chartData.length < months) {
    // If backend didn't return all months, log a warning
    console.warn(`Expected ${months} months but received ${chartData.length}`);
  }

  const maxValue = Math.max(
    ...chartData.map((d: any) => Math.max(d.income, d.expense)),
    1000
  );
  const yAxisMax = Math.ceil(maxValue / 1000) * 1000;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280' }}
            domain={[0, yAxisMax]}
            tickFormatter={(value) => {
              if (value >= 1000) return `${value / 1000}K`;
              return value.toString();
            }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [
              `₹${value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              'Income',
            ]}
            labelStyle={{ color: '#374151' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;

