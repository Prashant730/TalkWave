import { useSelector } from 'react-redux'

export const useAuth = () => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth)

  return {
    user,
    token,
    isAuthenticated,
    isLoading: false,
  }
}

export default useAuth
