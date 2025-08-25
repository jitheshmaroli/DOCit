/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  createSubscriptionPlanThunk,
  getSubscriptionPlansThunk,
  updateSubscriptionPlanThunk,
  deleteSubscriptionPlanThunk,
  withdrawSubscriptionPlanThunk,
} from '../../redux/thunks/doctorThunk';
import { SubscriptionPlan } from '../../types/authTypes';
import DataTable, { Column } from '../../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import { validateName, validateNumeric } from '../../utils/validation';

const ITEMS_PER_PAGE = 5;

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  validityDays: string;
  appointmentCount: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  validityDays?: string;
  appointmentCount?: string;
}

const DoctorPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    plans = [],
    loading,
    totalItems,
  } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [planData, setPlanData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    validityDays: '',
    appointmentCount: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user?.role === 'doctor') {
      dispatch(
        getSubscriptionPlansThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
    }
  }, [dispatch, user?.role, currentPage]);

  const validateDescription = (description: string): string | undefined => {
    if (!description) return 'Description is required';
    if (description.length < 10 || description.length > 500)
      return 'Description must be 10-500 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      name: validateName(planData.name),
      description: validateDescription(planData.description),
      price: validateNumeric(planData.price, 'Price'),
      validityDays: validateNumeric(planData.validityDays, 'Validity days'),
      appointmentCount: validateNumeric(
        planData.appointmentCount,
        'Appointment count'
      ),
    };
    setFormErrors(errors);
    return Object.values(errors).every((error) => !error);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPlanData({ ...planData, [name]: value });
    setFormErrors((prev) => ({
      ...prev,
      [name]:
        name === 'name'
          ? validateName(value)
          : name === 'description'
            ? validateDescription(value)
            : validateNumeric(
                value,
                name.charAt(0).toUpperCase() + name.slice(1)
              ),
    }));
  };

  const handleSubmitPlan = async () => {
    if (!validateForm()) {
      toast.error('Please fix all form errors');
      return;
    }

    try {
      const payload = {
        name: planData.name,
        description: planData.description,
        price: parseInt(planData.price),
        validityDays: parseInt(planData.validityDays),
        appointmentCount: parseInt(planData.appointmentCount),
      };

      if (isEditMode && selectedPlanId) {
        await dispatch(
          updateSubscriptionPlanThunk({ id: selectedPlanId, ...payload })
        ).unwrap();
        toast.success('Plan updated successfully');
      } else {
        await dispatch(createSubscriptionPlanThunk(payload)).unwrap();
        toast.success('Plan created successfully');
      }

      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedPlanId(null);
      setPlanData({
        name: '',
        description: '',
        price: '',
        validityDays: '',
        appointmentCount: '',
      });
      setFormErrors({});
      dispatch(
        getSubscriptionPlansThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
    } catch (error: any) {
      const errorMessage =
        error?.message || (error as Error)?.message || error || 'Unknown error';
      toast.error(
        `Failed to ${isEditMode ? 'update' : 'create'} plan: ${errorMessage}`
      );
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setIsEditMode(true);
    setSelectedPlanId(plan._id);
    setPlanData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price.toString(),
      validityDays: plan.validityDays.toString(),
      appointmentCount: plan.appointmentCount.toString(),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await dispatch(deleteSubscriptionPlanThunk(plan._id)).unwrap();
        toast.success('Plan deleted successfully');
        dispatch(
          getSubscriptionPlansThunk({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          })
        );
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          (error as Error)?.message ||
          error ||
          'Unknown error';
        toast.error(`Failed to delete plan: ${errorMessage}`);
      }
    }
  };

  const handleWithdrawPlan = async (plan: SubscriptionPlan) => {
    if (window.confirm('Are you sure you want to withdraw this plan?')) {
      try {
        await dispatch(withdrawSubscriptionPlanThunk(plan._id)).unwrap();
        toast.success('Plan withdrawn successfully');
        dispatch(
          getSubscriptionPlansThunk({
            page: currentPage,
            limit: ITEMS_PER_PAGE,
          })
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Failed to withdraw plan: ${errorMessage}`);
      }
    }
  };

  const handleViewDetails = (plan: SubscriptionPlan) => {
    navigate(`/doctor/plan-details/${plan._id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const columns: Column<SubscriptionPlan>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: (plan) => `₹${plan.price.toFixed(2)}` },
    { header: 'Validity', accessor: (plan) => `${plan.validityDays} days` },
    { header: 'Appointments', accessor: 'appointmentCount' },
    {
      header: 'Status',
      accessor: (plan) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs ${
            plan.status === 'approved'
              ? 'bg-green-500/20 text-green-300'
              : plan.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-red-500/20 text-red-300'
          }`}
        >
          {plan.status}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEditPlan,
      className: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      label: 'Delete',
      onClick: handleDeletePlan,
      className: 'bg-red-600 hover:bg-red-700',
    },
    {
      label: 'Withdraw',
      onClick: handleWithdrawPlan,
      className: 'bg-yellow-600 hover:bg-yellow-700',
      condition: (plan: SubscriptionPlan) => plan.status === 'pending',
    },
    {
      label: 'View Details',
      onClick: handleViewDetails,
      className: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Subscription Plans
          </h2>
          <button
            onClick={() => {
              setIsEditMode(false);
              setPlanData({
                name: '',
                description: '',
                price: '',
                validityDays: '',
                appointmentCount: '',
              });
              setFormErrors({});
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            + Add Plan
          </button>
        </div>
        <DataTable
          data={plans}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="No plans found. Add a new plan to get started."
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditMode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Plan Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter plan name"
                  value={planData.name}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-white/10 border ${
                    formErrors.name ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter plan description"
                  value={planData.description}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-white/10 border ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-white/20'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Price (in Rupees)
                </label>
                <input
                  id="price"
                  type="number"
                  name="price"
                  placeholder="Enter price in rupees"
                  value={planData.price}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-white/10 border ${
                    formErrors.price ? 'border-red-500' : 'border-white/20'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                  min="0"
                  step="1"
                />
                {formErrors.price && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="validityDays"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Validity (days)
                </label>
                <input
                  id="validityDays"
                  type="number"
                  name="validityDays"
                  placeholder="Enter validity in days"
                  value={planData.validityDays}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-white/10 border ${
                    formErrors.validityDays
                      ? 'border-red-500'
                      : 'border-white/20'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                  min="1"
                  step="1"
                />
                {formErrors.validityDays && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.validityDays}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="appointmentCount"
                  className="block text-sm font-medium text-white mb-1"
                >
                  Number of Appointments
                </label>
                <input
                  id="appointmentCount"
                  type="number"
                  name="appointmentCount"
                  placeholder="Enter number of appointments"
                  value={planData.appointmentCount}
                  onChange={handleInputChange}
                  className={`w-full p-3 bg-white/10 border ${
                    formErrors.appointmentCount
                      ? 'border-red-500'
                      : 'border-white/20'
                  } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400`}
                  min="1"
                  step="1"
                />
                {formErrors.appointmentCount && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.appointmentCount}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setSelectedPlanId(null);
                  setPlanData({
                    name: '',
                    description: '',
                    price: '',
                    validityDays: '',
                    appointmentCount: '',
                  });
                  setFormErrors({});
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPlan}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                {isEditMode ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorPlans;
