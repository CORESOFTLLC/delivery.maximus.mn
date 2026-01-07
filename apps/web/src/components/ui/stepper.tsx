'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// Stepper Context
interface StepperContextValue {
    activeStep: number;
    totalSteps: number;
    isCompleted: (step: number) => boolean;
    isActive: (step: number) => boolean;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

function useStepper() {
    const context = React.useContext(StepperContext);
    if (!context) {
        throw new Error('useStepper must be used within a Stepper');
    }
    return context;
}

// Stepper Root
interface StepperProps {
    activeStep: number;
    children: React.ReactNode;
    className?: string;
}

function Stepper({ activeStep, children, className }: StepperProps) {
    const childrenArray = React.Children.toArray(children);
    const totalSteps = childrenArray.length;

    const isCompleted = (step: number) => step < activeStep;
    const isActive = (step: number) => step === activeStep;

    return (
        <StepperContext.Provider value={{ activeStep, totalSteps, isCompleted, isActive }}>
            <div className={cn('flex items-center justify-between w-full', className)}>
                {React.Children.map(children, (child, index) => (
                    <>
                        {child}
                        {index < childrenArray.length - 1 && (
                            <StepperConnector isCompleted={isCompleted(index)} />
                        )}
                    </>
                ))}
            </div>
        </StepperContext.Provider>
    );
}

// Stepper Connector
interface StepperConnectorProps {
    isCompleted: boolean;
}

function StepperConnector({ isCompleted }: StepperConnectorProps) {
    return (
        <div
            className={cn(
                'flex-1 h-0.5 mx-2 transition-colors duration-300',
                isCompleted ? 'bg-primary' : 'bg-muted'
            )}
        />
    );
}

// Stepper Step
interface StepperStepProps {
    step: number;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    className?: string;
}

function StepperStep({ step, title, description, icon, className }: StepperStepProps) {
    const { isCompleted, isActive } = useStepper();
    const completed = isCompleted(step);
    const active = isActive(step);

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <div
                className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                    completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted bg-background text-muted-foreground'
                )}
            >
                {completed ? (
                    <Check className="w-5 h-5" />
                ) : icon ? (
                    icon
                ) : (
                    <span className="text-sm font-medium">{step + 1}</span>
                )}
            </div>
            <div className="flex flex-col items-center text-center">
                <span
                    className={cn(
                        'text-sm font-medium transition-colors',
                        active ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground'
                    )}
                >
                    {title}
                </span>
                {description && (
                    <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
                )}
            </div>
        </div>
    );
}

// Vertical Stepper
interface VerticalStepperProps {
    activeStep: number;
    children: React.ReactNode;
    className?: string;
}

function VerticalStepper({ activeStep, children, className }: VerticalStepperProps) {
    const childrenArray = React.Children.toArray(children);
    const totalSteps = childrenArray.length;

    const isCompleted = (step: number) => step < activeStep;
    const isActive = (step: number) => step === activeStep;

    return (
        <StepperContext.Provider value={{ activeStep, totalSteps, isCompleted, isActive }}>
            <div className={cn('flex flex-col gap-0', className)}>
                {React.Children.map(children, (child, index) => (
                    <div className="relative">
                        {child}
                        {index < childrenArray.length - 1 && (
                            <div
                                className={cn(
                                    'absolute left-5 top-12 w-0.5 h-8 -translate-x-1/2 transition-colors duration-300',
                                    isCompleted(index) ? 'bg-primary' : 'bg-muted'
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>
        </StepperContext.Provider>
    );
}

// Vertical Stepper Step
interface VerticalStepperStepProps {
    step: number;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

function VerticalStepperStep({ step, title, description, icon, children, className }: VerticalStepperStepProps) {
    const { isCompleted, isActive } = useStepper();
    const completed = isCompleted(step);
    const active = isActive(step);

    return (
        <div className={cn('flex gap-4', className)}>
            <div
                className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-all duration-300',
                    completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-muted bg-background text-muted-foreground'
                )}
            >
                {completed ? (
                    <Check className="w-5 h-5" />
                ) : icon ? (
                    icon
                ) : (
                    <span className="text-sm font-medium">{step + 1}</span>
                )}
            </div>
            <div className="flex-1 pb-8">
                <div className="flex flex-col">
                    <span
                        className={cn(
                            'text-sm font-medium transition-colors',
                            active ? 'text-primary' : completed ? 'text-foreground' : 'text-muted-foreground'
                        )}
                    >
                        {title}
                    </span>
                    {description && (
                        <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
                    )}
                </div>
                {active && children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
}

export {
    Stepper,
    StepperStep,
    VerticalStepper,
    VerticalStepperStep,
    useStepper,
};
