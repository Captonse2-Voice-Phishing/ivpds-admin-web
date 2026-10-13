import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { App } from './App';
import './theme/global.css';

dayjs.locale('vi');

const root = document.getElementById('root');
if (!root) {
  throw new Error('Không tìm thấy phần tử #root');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
