import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props { children: ReactNode }
interface State { coLoi: boolean }

export class RanhGioiLoi extends Component<Props, State> {
  state: State = { coLoi: false };

  static getDerivedStateFromError(): State {
    return { coLoi: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lỗi render giao diện:', error, info);
  }

  render() {
    if (this.state.coLoi) {
      return (
        <div className="fatal-error-page">
          <Result
            status="500"
            title="Giao diện gặp sự cố"
            subTitle="Dữ liệu của bạn không bị thay đổi. Hãy tải lại trang để tiếp tục."
            extra={<Button type="primary" onClick={() => window.location.reload()}>Tải lại trang</Button>}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
