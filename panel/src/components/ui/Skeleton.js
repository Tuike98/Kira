import React from 'react';
import './Skeleton.css';

const Skeleton = ({
  width,
  height,
  circle = false,
  count = 1,
  className = '',
  ...props
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{
        width: width || '100%',
        height: height || (circle ? width : '1rem'),
      }}
      {...props}
    />
  ));

  return count > 1 ? <div className="skeleton-group">{skeletons}</div> : skeletons;
};

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton height="200px" className="skeleton-mb" />
    <Skeleton width="60%" height="24px" className="skeleton-mb" />
    <Skeleton width="80%" height="16px" className="skeleton-mb" />
    <Skeleton width="70%" height="16px" />
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="skeleton-list">
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="skeleton-list-item">
        <Skeleton circle width="40px" />
        <div className="skeleton-list-content">
          <Skeleton width="40%" height="16px" className="skeleton-mb-sm" />
          <Skeleton width="60%" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
