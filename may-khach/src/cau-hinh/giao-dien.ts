import type { ThemeConfig } from 'antd';

export const giaoDien: ThemeConfig = {
  token: {
    colorPrimary: '#8f2d21',
    colorInfo: '#8f2d21',
    colorSuccess: '#2f7d4a',
    colorWarning: '#b66a1d',
    colorError: '#b42318',
    colorBgLayout: '#f7f4f1',
    colorBgContainer: '#ffffff',
    colorText: '#2b211d',
    colorTextSecondary: '#74625a',
    colorBorderSecondary: '#eee5e0',
    borderRadius: 14,
    borderRadiusLG: 18,
    controlHeight: 40,
    controlHeightLG: 46,
    boxShadowSecondary: '0 12px 34px rgba(52, 31, 24, .08)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 11,
      controlHeight: 40,
      fontWeight: 650,
      primaryShadow: '0 7px 18px rgba(143,45,33,.16)',
    },
    Card: {
      borderRadiusLG: 17,
      paddingLG: 22,
      headerFontSize: 15,
      headerFontSizeSM: 14,
    },
    Table: {
      borderColor: '#eee5e0',
      headerBg: '#faf7f5',
      headerColor: '#5d4b44',
      headerSplitColor: '#eee5e0',
      rowHoverBg: '#fff9f6',
      cellPaddingBlock: 13,
      cellPaddingInline: 14,
    },
    Modal: {
      borderRadiusLG: 18,
      titleFontSize: 18,
    },
    Drawer: {
      colorBgElevated: '#ffffff',
    },
    Input: {
      activeBorderColor: '#b75545',
      hoverBorderColor: '#c87666',
    },
    InputNumber: {
      activeBorderColor: '#b75545',
      hoverBorderColor: '#c87666',
    },
    Select: {
      optionSelectedBg: '#fff0e9',
      optionSelectedColor: '#7b241a',
    },
    DatePicker: {
      activeBorderColor: '#b75545',
      hoverBorderColor: '#c87666',
    },
    Tabs: {
      inkBarColor: '#8f2d21',
      itemSelectedColor: '#8f2d21',
      itemHoverColor: '#a23a2c',
    },
    Menu: {
      itemBorderRadius: 10,
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Statistic: {
      contentFontSize: 28,
    },
  },
};
