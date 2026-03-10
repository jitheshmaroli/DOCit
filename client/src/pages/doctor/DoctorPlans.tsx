/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  createSubscriptionPlanThunk,
  getSubscriptionPlansThunk,
  updateSubscriptionPlanThunk,
  deleteSubscriptionPlanThunk,
} from '../../redux/thunks/doctorThunk';
import DataTable, { Column } from '../../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { validateName, validateNumeric } from '../../utils/validation';
import { ITEMS_PER_PAGE } from '../../utils/constants';
import {
  FormErrors,
  PlanFormData,
  SubscriptionPlan,
} from '../../types/subscriptionTypes';
import { showError, showSuccess } from '../../utils/toastConfig';
import ROUTES from '../../constants/routeConstants';
import { Plus, AlertTriangle } from 'lucide-react';

const validateDescription = (d: string): string | undefined => {
  if (!d) return 'Description is required';
  if (d.length < 10 || d.length > 500)
    return 'Description must be 10–500 characters';
};

const EMPTY_PLAN: PlanFormData = {
  name: '',
  description: '',
  price: '',
  validityDays: '',
  appointmentCount: '',
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    approved: 'badge-success',
    pending: 'badge-warning',
    rejected: 'badge-error',
  };
  return (
    <span className={`badge ${map[status] || 'badge-neutral'} capitalize`}>
      {status}
    </span>
  );
};

const FormField = ({
  id,
  label,
  type = 'text',
  name,
  value,
  error,
  onChange,
  placeholder,
  min,
  step,
  rows,
}: {
  id: string;
  label: string;
  type?: string;
  name: string;
  value: string;
  error?: string;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  placeholder?: string;
  min?: string;
  step?: string;
  rows?: number;
}) => (
  <div>
    <label htmlFor={id} className="label mb-1">
      {label}
    </label>
    {rows ? (
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`input resize-none ${error ? 'input-error' : ''}`}
      />
    ) : (
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        className={`input ${error ? 'input-error' : ''}`}
      />
    )}
    {error && <p className="error-text mt-1">{error}</p>}
  </div>
);

const DoctorPlans: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    plans = [],
    loading,
    totalItems,
  } = useAppSelector((state) => state.doctors);
  const { user } = useAppSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [planData, setPlanData] = useState<PlanFormData>(EMPTY_PLAN);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  useEffect(() => {
    if (user?.role === 'doctor')
      dispatch(
        getSubscriptionPlansThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
  }, [dispatch, user?.role, currentPage]);

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
    return Object.values(errors).every((e) => !e);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPlanData((p) => ({ ...p, [name]: value }));
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

  const resetModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedPlanId(null);
    setPlanData(EMPTY_PLAN);
    setFormErrors({});
  };

  const handleSubmitPlan = async () => {
    if (!validateForm()) {
      showError('Please fix all form errors');
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
        showSuccess('Plan updated successfully');
      } else {
        await dispatch(createSubscriptionPlanThunk(payload)).unwrap();
        showSuccess('Plan created successfully');
      }
      resetModal();
      dispatch(
        getSubscriptionPlansThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
    } catch (error: any) {
      showError(
        `Failed to ${isEditMode ? 'update' : 'create'} plan: ${error?.message || error || 'Unknown error'}`
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

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      await dispatch(deleteSubscriptionPlanThunk(selectedPlan._id)).unwrap();
      showSuccess('Plan deleted successfully');
      dispatch(
        getSubscriptionPlansThunk({ page: currentPage, limit: ITEMS_PER_PAGE })
      );
    } catch (error: any) {
      showError(
        `Failed to delete plan: ${error?.message || error || 'Unknown error'}`
      );
    }
    setIsDeleteModalOpen(false);
    setSelectedPlan(null);
  };

  const columns: Column<SubscriptionPlan>[] = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Price',
      accessor: (p) => (
        <span className="font-semibold text-teal-600">
          ₹{p.price.toFixed(2)}
        </span>
      ),
    },
    { header: 'Validity', accessor: (p) => `${p.validityDays} days` },
    { header: 'Appointments', accessor: 'appointmentCount' },
    { header: 'Status', accessor: (p) => <StatusBadge status={p.status} /> },
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEditPlan,
      className: 'btn-secondary text-xs px-3 py-1.5',
    },
    {
      label: 'Delete',
      onClick: handleDeletePlan,
      className: 'btn-danger text-xs px-3 py-1.5',
    },
    {
      label: 'View Details',
      onClick: (p: SubscriptionPlan) =>
        navigate(ROUTES.DOCTOR.PLAN_DETAILS.replace(':planId', p._id)),
      className: 'btn-primary text-xs px-3 py-1.5',
    },
  ];

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">
            Create and manage your patient subscription plans
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setPlanData(EMPTY_PLAN);
            setFormErrors({});
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <DataTable
          data={plans}
          columns={columns}
          actions={actions}
          isLoading={loading}
          emptyMessage="No plans found. Add a new plan to get started."
        />
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-border">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title={isEditMode ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
        size="md"
        footer={
          <>
            <button onClick={resetModal} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmitPlan} className="btn-primary">
              {isEditMode ? 'Update Plan' : 'Create Plan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField
            id="name"
            label="Plan Name"
            name="name"
            value={planData.name}
            error={formErrors.name}
            onChange={handleInputChange}
            placeholder="e.g. Basic Monthly"
          />
          <FormField
            id="description"
            label="Description"
            name="description"
            value={planData.description}
            error={formErrors.description}
            onChange={handleInputChange}
            placeholder="Describe what's included..."
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="price"
              label="Price (₹)"
              type="number"
              name="price"
              value={planData.price}
              error={formErrors.price}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              step="1"
            />
            <FormField
              id="validityDays"
              label="Validity (days)"
              type="number"
              name="validityDays"
              value={planData.validityDays}
              error={formErrors.validityDays}
              onChange={handleInputChange}
              placeholder="30"
              min="1"
              step="1"
            />
            <FormField
              id="appointmentCount"
              label="Appointments"
              type="number"
              name="appointmentCount"
              value={planData.appointmentCount}
              error={formErrors.appointmentCount}
              onChange={handleInputChange}
              placeholder="5"
              min="1"
              step="1"
            />
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={isDeleteModalOpen && !!selectedPlan}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPlan(null);
        }}
        title="Delete Plan"
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPlan(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDeletePlan} className="btn-danger">
              Delete Plan
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle
            size={15}
            className="text-error flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-700">
            Are you sure you want to delete{' '}
            <strong>{selectedPlan?.name}</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorPlans;
