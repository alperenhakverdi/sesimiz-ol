import { useParams } from 'react-router-dom'
import UserProfile from '../components/profile/UserProfile'

const ProfilePage = () => {
  const { id } = useParams()
  
  return <UserProfile userId={id} />
}

export default ProfilePage