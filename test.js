import { FormField } from '@/utils/Models/Form';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ModalButtons from '@/utils/buttons/ModalButtons';
import { useGetPayheadsListQuery, useGetSingleEmployeeQuery } from '@/redux/query/CommonQuery';
import { Select, Tooltip } from 'antd';
import { TDeleteIcon } from '@/assets/icons';
import useSubmitHandler from '@/redux/tools/useSubmitHandler';
import { endpoint } from '@/helper/endpoint';

const AssignPayroll = ({ setOpen, actionBtnTxt, table_data, forEmployee = false }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { data: payheadList, refetch } = useGetPayheadsListQuery();
    const { data: singleEmployeePayheads } = useGetSingleEmployeeQuery(table_data?.id);
    const { handleSubmit: handlePostRequest, isLoading } = useSubmitHandler(process.env.NEXT_PUBLIC_ADMIN_SECRET);

    const [selectedPayheads, setSelectedPayheads] = useState([]);
    const [selectedValues, setSelectedValues] = useState([]);

    const onSubmit = async (data) => {
        const apiUrl = forEmployee
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/${endpoint.common}${endpoint.common_routes.hr_employee.employee}/${table_data?.id}${endpoint.common_routes.user_management.assign_payheads}`
            : `${process.env.NEXT_PUBLIC_BASE_URL}/${endpoint.common}${endpoint.common_routes.user_management.payrolls}/${table_data?.id}${endpoint.common_routes.user_management.assign_payheads}`;

        const postData = {
            payheads: selectedPayheads.map(payhead => ({
                id: payhead.id,
                amount: parseFloat(data[`payhead_${payhead.id}`]) || 0
            }))
        };
        await handlePostRequest({ data: postData, modalClose: setOpen, url: apiUrl, refetch: refetch });
    };

    const handleSelect = (value) => {
        // Get the selected payheads from the dropdown
        const newPayheads = payheadList?.data?.payhead?.filter(payhead => value.includes(payhead.name));

        // Add the newly selected payheads, while keeping existing ones
        const combinedPayheads = [...selectedPayheads, ...newPayheads].filter(
            (payhead, index, self) => index === self.findIndex(p => p.id === payhead.id)
        );

        setSelectedPayheads(combinedPayheads);
        setSelectedValues(value);
    };

    const handleDelete = (id) => {
        const updatedPayheads = selectedPayheads?.filter(item => item.id !== id);
        setSelectedPayheads(updatedPayheads);

        const deletedPayhead = selectedPayheads.find(payhead => payhead.id === id);
        if (deletedPayhead) {
            const updatedValues = selectedValues.filter(value => value !== deletedPayhead.name);
            setSelectedValues(updatedValues);
        }
    };

    useEffect(() => {
        if (singleEmployeePayheads?.data?.payheads?.length) {
            // Pre-fill selected payheads from employee's existing payheads
            const employeePayheads = singleEmployeePayheads.data.payheads.map(payhead => ({
                label: payhead.name,
                value: payhead.name
            }));
            setSelectedValues(employeePayheads.map(payhead => payhead.value));
            setSelectedPayheads(singleEmployeePayheads.data.payheads);
        }
    }, [singleEmployeePayheads]);

    useEffect(() => {
        if (payheadList?.data?.payhead?.length) {
            // Ensure all available payheads are still shown in the dropdown
            const availablePayheads = payheadList?.data?.payhead?.map(payhead => ({
                label: payhead.name,
                value: payhead.name
            }));
            setSelectedValues(prevValues => [...new Set([...prevValues, ...availablePayheads.map(p => p.value)])]);
        }
    }, [payheadList]);

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col md:gap-4'>
                <div className="w-full mt-2.5 md:mt-0 mb-2.5 md:mb-0">
                    {/* Multi-select dropdown */}
                    <Select
                        mode="multiple"
                        placeholder="Select Payheads"
                        style={{ width: '100%', marginBottom: '1rem' }}
                        onChange={handleSelect}
                        value={selectedValues}
                        options={payheadList?.data?.payhead?.map(payhead => ({
                            label: payhead.name,
                            value: payhead.name
                        }))}
                    />

                    {/* Dynamic Input Fields */}
                    <div className='!max-h-[350px] overflow-y-auto'>
                        <table className="table w-full">
                            <thead className="table-head">
                                <tr>
                                    <th>Name</th>
                                    <th className='"w-[177px]'>Amount/Value</th>
                                    <th>Payhead Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPayheads?.map(payhead => (
                                    <tr key={payhead.id}>
                                        <td className='td'>{payhead?.name}</td>
                                        <td className="w-[177px] td">
                                            <FormField
                                                type='number'
                                                register={register}
                                                defaultValue={payhead?.amount || 0}
                                                fieldName={`payhead_${payhead.id}`}
                                                placeholder={"Amount"}
                                                errors={errors}
                                            />
                                        </td>
                                        <td className='td'>
                                            <span className={`capitalize ${payhead?.type === 'addition' ? 'text-[var(--dot-success-bg)]' : payhead?.type === 'deduction' ? 'text-[var(--text-error-600)]' : ''}`}>
                                                {payhead?.type}
                                            </span>
                                        </td>
                                        <td>
                                            <Tooltip title="Delete">
                                                <div className="payhead-delete cursor-pointer" onClick={() => handleDelete(payhead.id)}>
                                                    <TDeleteIcon />
                                                </div>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <ModalButtons setOpen={setOpen} actionBtnTxt={actionBtnTxt} />
            </form>
        </div>
    );
};

export default AssignPayroll;
