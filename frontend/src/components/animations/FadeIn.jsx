import { motion as Motion } from 'framer-motion'

const fadeInVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      type: "tween",
      ease: "easeOut"
    }
  }
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const FadeIn = ({ children, delay = 0, stagger = false, ...props }) => {
  if (stagger) {
    return (
      <Motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        {...props}
      >
        {children}
      </Motion.div>
    )
  }

  return (
    <Motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      style={{
        ...fadeInVariants.hidden,
        transition: {
          ...fadeInVariants.visible.transition,
          delay
        }
      }}
      {...props}
    >
      {children}
    </Motion.div>
  )
}

export const FadeInItem = ({ children, ...props }) => {
  return (
    <Motion.div variants={fadeInVariants} {...props}>
      {children}
    </Motion.div>
  )
}

export default FadeIn
