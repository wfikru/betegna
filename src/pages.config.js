/**
 * pages.config.js - Page routing configuration
 */
import Home from './pages/Home';
import BrowseTaskers from './pages/BrowseTaskers';
import TaskerProfile from './pages/TaskerProfile';
import BookTasker from './pages/BookTasker';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Legal from './pages/Legal';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Home": Home,
    "BrowseTaskers": BrowseTaskers,
    "TaskerProfile": TaskerProfile,
    "BookTasker": BookTasker,
    "MyBookings": MyBookings,
    "BookingDetail": BookingDetail,
    "Profile": Profile,
    "Login": Login,
    "Messages": Messages,
    "Legal": Legal,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
