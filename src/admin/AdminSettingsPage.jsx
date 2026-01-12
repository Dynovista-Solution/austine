import { useState } from 'react'
import { useAdmin } from './AdminContext.jsx'
import {
  CogIcon,
  GlobeAltIcon,
  CreditCardIcon,
  TruckIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

export default function AdminSettingsPage() {
  const { isAdminLoggedIn } = useAdmin()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      siteName: 'AUSTINE',
      siteDescription: 'Luxury Fashion & Lifestyle',
      contactEmail: 'contact@austine.com',
      contactPhone: '+1 (555) 123-4567',
      currency: 'EUR',
      language: 'en'
    },
    shipping: {
      freeShippingThreshold: 100,
      standardShipping: 10,
      expressShipping: 25,
      internationalShipping: 50
    },
    payment: {
      stripeEnabled: true,
      paypalEnabled: true,
      bankTransferEnabled: false,
      codEnabled: true
    },
    notifications: {
      orderConfirmation: true,
      shippingUpdate: true,
      deliveryConfirmation: true,
      adminAlerts: true,
      marketingEmails: false
    },
    appearance: {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      logoUrl: '/logo.jpg',
      faviconUrl: '/favicon.ico'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      loginAttempts: 5
    }
  })

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    alert('Settings saved successfully!')
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'shipping', name: 'Shipping', icon: TruckIcon },
    { id: 'payment', name: 'Payment', icon: CreditCardIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ]

  const SettingSection = ({ title, description, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )

  const SettingField = ({ label, type = 'text', value, onChange, placeholder, options, help }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">{help}</span>
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )

  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your store settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="space-y-6">
            {activeTab === 'general' && (
              <SettingSection
                title="General Settings"
                description="Basic information about your store"
              >
                <SettingField
                  label="Site Name"
                  value={settings.general.siteName}
                  onChange={(value) => handleSettingChange('general', 'siteName', value)}
                  placeholder="Enter site name"
                />
                <SettingField
                  label="Site Description"
                  value={settings.general.siteDescription}
                  onChange={(value) => handleSettingChange('general', 'siteDescription', value)}
                  placeholder="Enter site description"
                />
                <SettingField
                  label="Contact Email"
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(value) => handleSettingChange('general', 'contactEmail', value)}
                  placeholder="Enter contact email"
                />
                <SettingField
                  label="Contact Phone"
                  value={settings.general.contactPhone}
                  onChange={(value) => handleSettingChange('general', 'contactPhone', value)}
                  placeholder="Enter contact phone"
                />
                <SettingField
                  label="Currency"
                  type="select"
                  value={settings.general.currency}
                  onChange={(value) => handleSettingChange('general', 'currency', value)}
                  options={[
                    { value: 'EUR', label: 'Euro (€)' },
                    { value: 'USD', label: 'US Dollar ($)' },
                    { value: 'GBP', label: 'British Pound (£)' }
                  ]}
                />
              </SettingSection>
            )}

            {activeTab === 'shipping' && (
              <SettingSection
                title="Shipping Settings"
                description="Configure shipping rates and options"
              >
                <SettingField
                  label="Free Shipping Threshold (€)"
                  type="number"
                  value={settings.shipping.freeShippingThreshold}
                  onChange={(value) => handleSettingChange('shipping', 'freeShippingThreshold', parseFloat(value))}
                  placeholder="100"
                />
                <SettingField
                  label="Standard Shipping (€)"
                  type="number"
                  value={settings.shipping.standardShipping}
                  onChange={(value) => handleSettingChange('shipping', 'standardShipping', parseFloat(value))}
                  placeholder="10"
                />
                <SettingField
                  label="Express Shipping (€)"
                  type="number"
                  value={settings.shipping.expressShipping}
                  onChange={(value) => handleSettingChange('shipping', 'expressShipping', parseFloat(value))}
                  placeholder="25"
                />
                <SettingField
                  label="International Shipping (€)"
                  type="number"
                  value={settings.shipping.internationalShipping}
                  onChange={(value) => handleSettingChange('shipping', 'internationalShipping', parseFloat(value))}
                  placeholder="50"
                />
              </SettingSection>
            )}

            {activeTab === 'payment' && (
              <SettingSection
                title="Payment Methods"
                description="Enable or disable payment options"
              >
                <SettingField
                  label="Stripe"
                  type="checkbox"
                  value={settings.payment.stripeEnabled}
                  onChange={(value) => handleSettingChange('payment', 'stripeEnabled', value)}
                  help="Accept credit/debit cards via Stripe"
                />
                <SettingField
                  label="PayPal"
                  type="checkbox"
                  value={settings.payment.paypalEnabled}
                  onChange={(value) => handleSettingChange('payment', 'paypalEnabled', value)}
                  help="Accept payments via PayPal"
                />
                <SettingField
                  label="Bank Transfer"
                  type="checkbox"
                  value={settings.payment.bankTransferEnabled}
                  onChange={(value) => handleSettingChange('payment', 'bankTransferEnabled', value)}
                  help="Accept bank transfers"
                />
                <SettingField
                  label="Cash on Delivery"
                  type="checkbox"
                  value={settings.payment.codEnabled}
                  onChange={(value) => handleSettingChange('payment', 'codEnabled', value)}
                  help="Accept cash on delivery"
                />
              </SettingSection>
            )}

            {activeTab === 'notifications' && (
              <SettingSection
                title="Notification Settings"
                description="Configure email notifications"
              >
                <SettingField
                  label="Order Confirmation"
                  type="checkbox"
                  value={settings.notifications.orderConfirmation}
                  onChange={(value) => handleSettingChange('notifications', 'orderConfirmation', value)}
                  help="Send confirmation emails for new orders"
                />
                <SettingField
                  label="Shipping Updates"
                  type="checkbox"
                  value={settings.notifications.shippingUpdate}
                  onChange={(value) => handleSettingChange('notifications', 'shippingUpdate', value)}
                  help="Send updates when orders are shipped"
                />
                <SettingField
                  label="Delivery Confirmation"
                  type="checkbox"
                  value={settings.notifications.deliveryConfirmation}
                  onChange={(value) => handleSettingChange('notifications', 'deliveryConfirmation', value)}
                  help="Send confirmation when orders are delivered"
                />
                <SettingField
                  label="Admin Alerts"
                  type="checkbox"
                  value={settings.notifications.adminAlerts}
                  onChange={(value) => handleSettingChange('notifications', 'adminAlerts', value)}
                  help="Send alerts to admin for important events"
                />
                <SettingField
                  label="Marketing Emails"
                  type="checkbox"
                  value={settings.notifications.marketingEmails}
                  onChange={(value) => handleSettingChange('notifications', 'marketingEmails', value)}
                  help="Send promotional emails to customers"
                />
              </SettingSection>
            )}

            {activeTab === 'appearance' && (
              <SettingSection
                title="Appearance Settings"
                description="Customize your store's look and feel"
              >
                <SettingField
                  label="Primary Color"
                  type="color"
                  value={settings.appearance.primaryColor}
                  onChange={(value) => handleSettingChange('appearance', 'primaryColor', value)}
                />
                <SettingField
                  label="Secondary Color"
                  type="color"
                  value={settings.appearance.secondaryColor}
                  onChange={(value) => handleSettingChange('appearance', 'secondaryColor', value)}
                />

                <SettingField
                  label="Logo URL"
                  value={settings.appearance.logoUrl}
                  onChange={(value) => handleSettingChange('appearance', 'logoUrl', value)}
                  placeholder="Enter logo URL"
                />

                <SettingField
                  label="Favicon URL"
                  value={settings.appearance.faviconUrl}
                  onChange={(value) => handleSettingChange('appearance', 'faviconUrl', value)}
                  placeholder="Enter favicon URL"
                />
              </SettingSection>
            )}

            {activeTab === 'security' && (
              <SettingSection
                title="Security Settings"
                description="Configure security and authentication options"
              >
                <SettingField
                  label="Two-Factor Authentication"
                  type="checkbox"
                  value={settings.security.twoFactorAuth}
                  onChange={(value) => handleSettingChange('security', 'twoFactorAuth', value)}
                  help="Require 2FA for admin accounts"
                />
                <SettingField
                  label="Session Timeout (minutes)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(value) => handleSettingChange('security', 'sessionTimeout', parseInt(value))}
                  placeholder="30"
                />
                <SettingField
                  label="Minimum Password Length"
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(value) => handleSettingChange('security', 'passwordMinLength', parseInt(value))}
                  placeholder="8"
                />
                <SettingField
                  label="Max Login Attempts"
                  type="number"
                  value={settings.security.loginAttempts}
                  onChange={(value) => handleSettingChange('security', 'loginAttempts', parseInt(value))}
                  placeholder="5"
                />
              </SettingSection>
            )}

            {/* Save Button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}