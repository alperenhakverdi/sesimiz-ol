import { motion } from 'framer-motion'

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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
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
    </motion.div>
  )
}

export const FadeInItem = ({ children, ...props }) => {
  return (
    <motion.div variants={fadeInVariants} {...props}>
      {children}
    </motion.div>
  )
}

export default FadeIn