const REPORT_KEY = "cardioai_final_report_v1";

export const getReport = () => {
  try {
    return JSON.parse(localStorage.getItem(REPORT_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveReportSection = (section, data) => {
  const existing = getReport();
  const updated = {
    ...existing,
    [section]: {
      ...data,
      timestamp: new Date().toISOString()
    }
  };
  localStorage.setItem(REPORT_KEY, JSON.stringify(updated));
};

export const clearReport = () => {
  localStorage.removeItem(REPORT_KEY);
};
