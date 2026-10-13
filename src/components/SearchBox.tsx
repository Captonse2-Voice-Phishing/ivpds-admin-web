import { Input } from 'antd';
import { useEffect, useState } from 'react';

interface Props {
  /** Giá trị đang áp dụng (trên URL). */
  value: string | undefined;
  onSearch: (value: string | undefined) => void;
  placeholder: string;
  width?: number;
}

/** Ô tìm kiếm: chỉ áp dụng khi nhấn Enter, bấm nút tìm hoặc xóa trắng; luôn khớp lại với URL. */
export function SearchBox({ value, onSearch, placeholder, width = 260 }: Props) {
  const [text, setText] = useState(value ?? '');

  useEffect(() => {
    setText(value ?? '');
  }, [value]);

  return (
    <Input.Search
      allowClear
      value={text}
      placeholder={placeholder}
      style={{ width }}
      onChange={(event) => setText(event.target.value)}
      onSearch={(next) => onSearch(next.trim() || undefined)}
    />
  );
}
