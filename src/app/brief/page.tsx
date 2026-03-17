import PageShell from '@/components/layout/PageShell';
import DateHeader from '@/components/brief/DateHeader';
import BriefList from '@/components/brief/BriefList';

export default function BriefPage() {
  return (
    <PageShell>
      <DateHeader />
      <BriefList />
    </PageShell>
  );
}
