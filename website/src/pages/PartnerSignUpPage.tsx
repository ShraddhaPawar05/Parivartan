import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

const PartnerSignUpPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Organizational Information
    organization: '',
    partnerType: '',
    address: '',
    supportedWasteTypes: [] as string[],
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [_loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleWasteTypeChange = (wasteType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      supportedWasteTypes: checked
        ? [...prev.supportedWasteTypes, wasteType]
        : prev.supportedWasteTypes.filter(type => type !== wasteType),
    }));

    // Clear error when user selects
    if (errors.supportedWasteTypes) {
      setErrors(prev => ({
        ...prev,
        supportedWasteTypes: '',
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = t('signUp.errors.nameRequired');
      if (!formData.email.trim()) newErrors.email = t('signUp.errors.emailRequired');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('signUp.errors.emailInvalid');
      if (!formData.phone.trim()) newErrors.phone = t('signUp.errors.phoneRequired');
      if (!formData.password) newErrors.password = t('signUp.errors.passwordRequired');
      else if (formData.password.length < 8) newErrors.password = t('signUp.errors.passwordMinLength');
      if (!formData.confirmPassword) newErrors.confirmPassword = t('signUp.errors.confirmPasswordRequired');
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('signUp.errors.passwordsMismatch');
    } else if (step === 2) {
      if (!formData.organization.trim()) newErrors.organization = t('signUp.errors.orgRequired');
      if (!formData.partnerType) newErrors.partnerType = t('signUp.errors.partnerTypeRequired');
      if (formData.partnerType && formData.supportedWasteTypes.length === 0) newErrors.supportedWasteTypes = t('signUp.errors.wasteTypesRequired');
      if (!formData.address.trim()) newErrors.address = t('signUp.errors.addressRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      // Prepare partner data for Firebase
      const partnerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization,
        partnerType: formData.partnerType,
        address: formData.address,
        supportedWasteTypes: formData.supportedWasteTypes,
        verificationStatus: 'pending' as const,
        documents: [],
        rewardPoints: 0,
        subscription: undefined,
        createdAt: new Date().toISOString()
      };

      // Call the actual signUp function to create Firebase user and store in database
      await signUp(formData.email, formData.password, partnerData);

      // Move to step 3 (subscription selection)
      setCurrentStep(3);
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to create account';
      const err = error as { code?: string; message?: string };
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = t('signUp.errors.emailAlreadyInUse');
            break;
          case 'auth/invalid-email':
            errorMessage = t('signUp.errors.invalidEmail');
            break;
          case 'auth/weak-password':
            errorMessage = t('signUp.errors.weakPassword');
            break;
          case 'auth/network-request-failed':
            errorMessage = t('signUp.errors.networkError');
            break;
          case 'auth/too-many-requests':
            errorMessage = t('signUp.errors.tooManyRequests');
            break;
          default:
            errorMessage = err.message || t('signUp.errors.failedToCreate');
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: t('signUp.step1Title'), description: t('signUp.step1Desc') },
    { number: 2, title: t('signUp.step2Title'), description: t('signUp.step2Desc') },
    { number: 3, title: t('signUp.step3Title'), description: t('signUp.step3Desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">Parivartan</h1>
        </Link>
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t('signUp.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('signUp.subtitle')}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.number
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.number ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  currentStep > step.number ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-900">{steps[currentStep - 1].title}</h3>
          <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.fullName')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.emailAddress')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.phoneNumber')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.password')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.confirmPassword')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Organizational Information */}
            {currentStep === 2 && (
              <>
                <div>
                  <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.orgName')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      required
                      value={formData.organization}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.organization ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.organization && <p className="mt-1 text-sm text-red-600">{errors.organization}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="partnerType" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.partnerType')}
                  </label>
                  <div className="mt-1">
                    <select
                      id="partnerType"
                      name="partnerType"
                      required
                      value={formData.partnerType}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                        errors.partnerType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{t('signUp.selectPartnerType')}</option>
                      <option value="NGO">🏢 NGO</option>
                      <option value="Municipal">🏛️ Municipal</option>
                      <option value="Startup">🚀 Startup</option>
                      <option value="Artisan">🔨 Artisan</option>
                      <option value="Self help group">👥 Self Help Group</option>
                    </select>
                    {errors.partnerType && <p className="mt-1 text-sm text-red-600">{errors.partnerType}</p>}
                  </div>
                </div>

                {/* Waste Types Selection - Only show after partner type is selected */}
                {formData.partnerType && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('signUp.wasteTypesLabel')}
                    </label>
                    <div className="mt-1 grid grid-cols-2 gap-3">
                      {['Plastic', 'Metal', 'Cloth / Textile', 'Paper', 'Cardboard', 'Glass'].map((wasteType) => (
                        <label key={wasteType} className="flex items-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200">
                          <input
                            type="checkbox"
                            checked={formData.supportedWasteTypes.includes(wasteType)}
                            onChange={(e) => handleWasteTypeChange(wasteType, e.target.checked)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-700">{wasteType}</span>
                        </label>
                      ))}
                    </div>
                    {errors.supportedWasteTypes && <p className="mt-1 text-sm text-red-600">{errors.supportedWasteTypes}</p>}
                  </div>
                )}

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('signUp.address')}
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className={`appearance-none block w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Document Upload */}
            {currentStep === 3 && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('signUp.successTitle')}</h3>
                <p className="text-gray-600 mb-6">{t('signUp.successDesc')}</p>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-emerald-900 mb-2">📋 {t('signUp.nextSteps')}</h4>
                  <p className="text-sm text-emerald-700">{t('signUp.nextStepsDesc')}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {t('signUp.previous')}
                </button>
              )}

              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {t('signUp.next')}
                </button>
              ) : currentStep === 2 ? (
                <button
                  type="submit"
                  disabled={_loading}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {_loading ? t('signUp.creatingAccount') : t('signUp.createAccount')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/document-upload')}
                  className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {t('signUp.uploadDocuments')}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('signUp.alreadyHaveAccount')}</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/dashboard"
                className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-gray-500 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300"
              >
                {t('nav.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSignUpPage;