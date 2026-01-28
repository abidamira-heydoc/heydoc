import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import { useAdmin } from '../../contexts/AdminContext';

type ReportType = 'monthly' | 'quarterly' | 'annual';

const ImpactReports: React.FC = () => {
  const { t } = useTranslation('admin');
  const { organization, metrics, metricsLoading, analyticsData } = useAdmin();
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [generating, setGenerating] = useState(false);

  // Calculate estimated cost savings (placeholder logic)
  const estimatedSavings = (metrics?.totalConversations ?? 0) * 50; // $50 per avoided ER visit

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 7) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
      };

      // Helper to check if we need a new page
      const checkNewPage = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // ========== HEADER ==========
      // Green header bar
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(0, 0, pageWidth, 40, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.title'), margin, 25);

      // Organization name
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(organization?.name || 'Organization', margin, 35);

      // Report date
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(reportDate, pageWidth - margin - 50, 35);

      yPos = 55;

      // ========== EXECUTIVE SUMMARY ==========
      doc.setTextColor(31, 41, 55); // gray-800
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.executiveSummary'), margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99); // gray-600
      const summaryText = t('reports.pdf.summaryText', { orgName: organization?.name || 'your organization' });
      yPos = addWrappedText(summaryText, margin, yPos, pageWidth - (margin * 2));
      yPos += 10;

      // ========== KEY METRICS ==========
      checkNewPage(60);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.keyMetrics'), margin, yPos);
      yPos += 12;

      // Metrics boxes
      const boxWidth = (pageWidth - (margin * 2) - 15) / 4;
      const boxHeight = 35;
      const metrics_data = [
        { label: t('reports.pdf.totalUsers'), value: String(metrics?.totalUsers ?? 0), color: [16, 185, 129] },
        { label: t('reports.pdf.conversations'), value: String(metrics?.totalConversations ?? 0), color: [59, 130, 246] },
        { label: t('reports.pdf.emergencyAlerts'), value: String(metrics?.emergencyFlags ?? 0), color: [239, 68, 68] },
        { label: t('reports.pdf.activeUsers'), value: String(metrics?.activeUsers ?? 0), color: [139, 92, 246] },
      ];

      metrics_data.forEach((metric, index) => {
        const xPos = margin + (index * (boxWidth + 5));

        // Box background
        doc.setFillColor(249, 250, 251); // gray-50
        doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 3, 3, 'F');

        // Colored top border
        doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.rect(xPos, yPos, boxWidth, 3, 'F');

        // Value
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, xPos + boxWidth / 2, yPos + 18, { align: 'center' });

        // Label
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, xPos + boxWidth / 2, yPos + 28, { align: 'center' });
      });

      yPos += boxHeight + 15;

      // ========== COST SAVINGS ==========
      checkNewPage(50);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.estimatedCostSavings'), margin, yPos);
      yPos += 10;

      // Green savings box
      doc.setFillColor(236, 253, 245); // green-50
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 40, 3, 3, 'F');

      // Border
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 40, 3, 3, 'S');

      // Savings amount
      doc.setTextColor(6, 95, 70); // green-800
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${estimatedSavings.toLocaleString()}`, margin + 10, yPos + 20);

      // Savings description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(21, 128, 61); // green-700
      doc.text(t('reports.pdf.savingsNote1'), margin + 10, yPos + 30);
      doc.text(t('reports.pdf.savingsNote2'), margin + 10, yPos + 37);

      yPos += 55;

      // ========== EMERGENCY DETECTION IMPACT ==========
      checkNewPage(60);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.emergencyDetectionImpact'), margin, yPos);
      yPos += 10;

      // Red alert box
      doc.setFillColor(254, 242, 242); // red-50
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 35, 3, 3, 'F');

      // Border
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 35, 3, 3, 'S');

      // Emergency count
      doc.setTextColor(127, 29, 29); // red-900
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.emergencySituationsDetected', { count: metrics?.emergencyFlags ?? 0 }), margin + 10, yPos + 14);

      // Description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(185, 28, 28); // red-700
      const emergencyText = t('reports.pdf.emergencyNote');
      addWrappedText(emergencyText, margin + 10, yPos + 22, pageWidth - (margin * 2) - 20, 5);

      yPos += 50;

      // ========== USAGE INSIGHTS ==========
      checkNewPage(60);
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(t('reports.pdf.usageInsights'), margin, yPos);
      yPos += 12;

      // Calculate insights
      const engagementRate = metrics && metrics.totalUsers > 0
        ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
        : 0;
      const avgConversations = metrics && metrics.totalUsers > 0
        ? (metrics.totalConversations / metrics.totalUsers).toFixed(1)
        : '0';
      const emergencyRate = metrics && metrics.totalConversations > 0
        ? ((metrics.emergencyFlags / metrics.totalConversations) * 100).toFixed(1)
        : '0';

      const insights = [
        { label: t('reports.pdf.engagementRate'), value: `${engagementRate}%`, desc: t('reports.pdf.engagementRateDesc') },
        { label: t('reports.pdf.avgConversations'), value: avgConversations, desc: t('reports.pdf.avgConversationsDesc') },
        { label: t('reports.pdf.emergencyRate'), value: `${emergencyRate}%`, desc: t('reports.pdf.emergencyRateDesc') },
      ];

      insights.forEach((insight, index) => {
        const insightBoxWidth = (pageWidth - (margin * 2) - 10) / 3;
        const xPos = margin + (index * (insightBoxWidth + 5));

        doc.setFillColor(249, 250, 251);
        doc.roundedRect(xPos, yPos, insightBoxWidth, 30, 2, 2, 'F');

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(insight.value, xPos + 5, yPos + 12);

        doc.setTextColor(75, 85, 99);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(insight.label, xPos + 5, yPos + 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(insight.desc, xPos + 5, yPos + 26);
      });

      yPos += 45;

      // ========== TOP SYMPTOMS (if available) ==========
      if (analyticsData?.topSymptoms && analyticsData.topSymptoms.some(s => s.count > 0)) {
        checkNewPage(60);
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(t('reports.pdf.mostCommonHealthTopics'), margin, yPos);
        yPos += 10;

        analyticsData.topSymptoms.slice(0, 5).forEach((symptom) => {
          if (symptom.count > 0) {
            doc.setFillColor(243, 244, 246);
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 8, 1, 1, 'F');

            // Progress bar
            const maxCount = Math.max(...analyticsData.topSymptoms.map(s => s.count));
            const barWidth = ((symptom.count / maxCount) * (pageWidth - (margin * 2) - 60));
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(margin, yPos, barWidth, 8, 1, 1, 'F');

            doc.setTextColor(31, 41, 55);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`${symptom.name} (${symptom.count})`, margin + 5, yPos + 5.5);

            yPos += 12;
          }
        });

        yPos += 5;
      }

      // ========== FOOTER ==========
      const addFooter = (pageNum: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'normal');

        // Footer line
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Footer text
        doc.text(t('reports.pdf.generatedBy'), margin, pageHeight - 8);
        doc.text(t('reports.pdf.page', { current: pageNum, total: totalPages }), pageWidth - margin - 20, pageHeight - 8);
        doc.text(reportDate, pageWidth / 2, pageHeight - 8, { align: 'center' });
      };

      // Add footers to all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i, totalPages);
      }

      // Generate filename
      const reportPeriod = reportType === 'monthly' ? 'Monthly' : reportType === 'quarterly' ? 'Quarterly' : 'Annual';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `HeyDoc_${reportPeriod}_Report_${organization?.name?.replace(/\s+/g, '_') || 'Report'}_${dateStr}.pdf`;

      // Download the PDF
      doc.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-500 mt-1">{t('reports.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="monthly">{t('reports.types.monthly')}</option>
            <option value="quarterly">{t('reports.types.quarterly')}</option>
            <option value="annual">{t('reports.types.annual')}</option>
          </select>
          <button
            onClick={generatePDF}
            disabled={generating || metricsLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('reports.generating')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('reports.downloadPDF')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <img src="/heydoclogo.png" alt="HeyDoc" className="w-12 h-12 object-contain bg-white rounded-lg p-1" />
            <div>
              <h2 className="text-2xl font-bold">{t('reports.preview.title')}</h2>
              <p className="text-primary-100">{organization?.name || 'Organization'}</p>
            </div>
          </div>
          <p className="text-sm text-primary-100">
            {t('reports.preview.reportPeriod', { period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })}
          </p>
        </div>

        {/* Report Content */}
        <div className="p-6 space-y-8">
          {/* Executive Summary */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('reports.sections.executiveSummary')}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">
                {t('reports.sections.summaryText')}
              </p>
            </div>
          </section>

          {/* Key Metrics */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('reports.sections.keyMetrics')}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm text-green-700 mb-1">{t('dashboard.stats.totalUsers')}</p>
                {metricsLoading ? (
                  <div className="h-8 w-16 bg-green-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-green-900">{metrics?.totalUsers ?? 0}</p>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-700 mb-1">{t('analytics.metrics.conversations')}</p>
                {metricsLoading ? (
                  <div className="h-8 w-16 bg-blue-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-blue-900">{metrics?.totalConversations ?? 0}</p>
                )}
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm text-red-700 mb-1">{t('dashboard.stats.emergencyAlerts')}</p>
                {metricsLoading ? (
                  <div className="h-8 w-16 bg-red-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-red-900">{metrics?.emergencyFlags ?? 0}</p>
                )}
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <p className="text-sm text-purple-700 mb-1">{t('dashboard.stats.activeUsers')}</p>
                {metricsLoading ? (
                  <div className="h-8 w-16 bg-purple-200 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-purple-900">{metrics?.activeUsers ?? 0}</p>
                )}
              </div>
            </div>
          </section>

          {/* Cost Savings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('reports.sections.estimatedCostSavings')}
            </h3>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-green-700 mb-1">{t('reports.sections.estimatedSavings')}</p>
                  <p className="text-3xl font-bold text-green-900">
                    ${estimatedSavings.toLocaleString()}
                  </p>
                </div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-green-700">
                {t('reports.sections.savingsDescription')}
              </p>
            </div>
          </section>

          {/* Emergency Detection Impact */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {t('reports.sections.emergencyDetectionImpact')}
            </h3>
            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-900 mb-2">
                    {t('reports.sections.emergencySituationsDetected', { count: metrics?.emergencyFlags ?? 0 })}
                  </p>
                  <p className="text-sm text-red-700">
                    {t('reports.sections.emergencyDescription')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Insights */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t('reports.sections.usageInsights')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700">{t('analytics.insights.engagementRate')}</p>
                <p className="text-2xl font-bold text-primary-700 mt-1">
                  {metrics && metrics.totalUsers > 0
                    ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('analytics.insights.engagementDesc')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700">{t('analytics.insights.avgConversations')}</p>
                <p className="text-2xl font-bold text-primary-700 mt-1">
                  {metrics && metrics.totalUsers > 0
                    ? (metrics.totalConversations / metrics.totalUsers).toFixed(1)
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('analytics.insights.avgConversationsDesc')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700">{t('analytics.insights.emergencyRate')}</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {metrics && metrics.totalConversations > 0
                    ? ((metrics.emergencyFlags / metrics.totalConversations) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">{t('analytics.insights.emergencyRateDesc')}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Report Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500 text-center">
            {t('reports.footer.generatedBy')} | {t('reports.footer.reportDate', { date: new Date().toLocaleDateString() })}
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">{t('reports.info.title')}</p>
            <p className="text-sm text-blue-700 mt-1">
              {t('reports.info.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactReports;
