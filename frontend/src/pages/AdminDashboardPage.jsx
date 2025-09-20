import { Heading, Text, VStack } from '@chakra-ui/react'
import AdminLayout from '../components/admin/AdminLayout'
import UserStatsWidget from '../components/admin/widgets/UserStatsWidget'
import StoryStatsWidget from '../components/admin/widgets/StoryStatsWidget'
import FeatureFlagWidget from '../components/admin/widgets/FeatureFlagWidget'
import RecentActivityWidget from '../components/admin/widgets/RecentActivityWidget'
import QuickAccessWidget from '../components/admin/widgets/QuickAccessWidget'

const AdminDashboardPage = () => {
  return (
    <AdminLayout>
      <VStack align="start" spacing={6}>
        <Heading size="lg" color="brand.600">
          Admin Dashboard
        </Heading>

        <UserStatsWidget />

        <StoryStatsWidget />

        <FeatureFlagWidget />

        <RecentActivityWidget />

        <QuickAccessWidget />
      </VStack>
    </AdminLayout>
  )
}

export default AdminDashboardPage
