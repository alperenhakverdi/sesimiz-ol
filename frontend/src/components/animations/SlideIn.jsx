import { motion } from 'framer-motion'

const slideVariants = {
  fromLeft: {
    hidden: { x: -100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  },
  fromRight: {
    hidden: { x: 100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  },
  fromTop: {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  },
  fromBottom: {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }
}

const SlideIn = ({ children, direction = "fromBottom", delay = 0, ...props }) => {
  const variants = slideVariants[direction] || slideVariants.fromBottom

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: variants.hidden,
        visible: {
          ...variants.visible,
          transition: {
            ...variants.visible.transition,
            delay
          }
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default SlideIn